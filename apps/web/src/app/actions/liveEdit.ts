'use server'

import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

type CookieStore = Awaited<ReturnType<typeof cookies>>

async function isEditorAuthorized(cookieStore: CookieStore): Promise<boolean> {
  if (cookieStore.get('payload-token')) return true
  const editorToken = cookieStore.get('editor_token')?.value
  return !!editorToken && editorToken === process.env.EDITOR_SHARE_TOKEN
}

export async function updateLiveField({
  collection,
  id,
  field,
  value,
  locale,
}: {
  collection: 'pages' | 'products'
  id: string
  field: string
  value: string
  locale?: string
}) {
  const cookieStore = await cookies()
  if (!(await isEditorAuthorized(cookieStore))) {
    throw new Error('Non autorisé — connexion admin requise')
  }

  const payload = await getPayload({ config })
  const payloadId = parseInt(id, 10)
  const payloadLocale = (locale as 'fr' | 'en' | 'ru' | undefined) ?? 'fr'

  // Handle nested block fields like 'blocks.0.tagline'
  const blockMatch = field.match(/^blocks\.(\d+)\.(.+)$/)
  if (blockMatch) {
    const blockIndex = parseInt(blockMatch[1] ?? '0', 10)
    const subField = blockMatch[2] ?? ''

    // Fetch the current document to get the full blocks array
    const doc = await payload.findByID({
      collection,
      id: payloadId,
      depth: 0,
      locale: payloadLocale,
      overrideAccess: true,
    })

    const rawBlocks = (doc as { blocks?: unknown[] }).blocks
    const blocks: unknown[] = Array.isArray(rawBlocks) ? [...rawBlocks] : []

    if (blockIndex < blocks.length) {
      blocks[blockIndex] = {
        ...(blocks[blockIndex] as Record<string, unknown>),
        [subField]: value,
      }
    }

    await payload.update({
      collection,
      id: payloadId,
      data: { blocks } as Record<string, unknown>,
      locale: payloadLocale,
      overrideAccess: true,
    })
  } else {
    await payload.update({
      collection,
      id: payloadId,
      data: { [field]: value },
      locale: payloadLocale,
      overrideAccess: true,
    })
  }

  revalidatePath('/', 'layout')
}

// ─── Block structural mutations ───────────────────────────────────────────────

type BlockCollection = 'pages' | 'products'

async function fetchBlocks(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: BlockCollection,
  id: number,
): Promise<unknown[]> {
  const doc = await payload.findByID({
    collection,
    id,
    depth: 0,
    overrideAccess: true,
  })
  const raw = (doc as { blocks?: unknown[] }).blocks
  return Array.isArray(raw) ? [...raw] : []
}

async function saveBlocks(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: BlockCollection,
  id: number,
  blocks: unknown[],
) {
  await payload.update({
    collection,
    id,
    data: { blocks } as Record<string, unknown>,
    overrideAccess: true,
  })
  revalidatePath('/', 'layout')
}

export async function reorderBlock({
  collection,
  id,
  blockIndex,
  direction,
}: {
  collection: BlockCollection
  id: string
  blockIndex: number
  direction: 'up' | 'down'
}) {
  const cookieStore = await cookies()
  if (!(await isEditorAuthorized(cookieStore))) {
    throw new Error('Non autorisé — connexion admin requise')
  }

  const payload = await getPayload({ config })
  const payloadId = parseInt(id, 10)
  const blocks = await fetchBlocks(payload, collection, payloadId)

  const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1
  if (targetIndex < 0 || targetIndex >= blocks.length) return

  // Swap
  const tmp = blocks[blockIndex]
  blocks[blockIndex] = blocks[targetIndex]!
  blocks[targetIndex] = tmp!

  await saveBlocks(payload, collection, payloadId, blocks)
}

export async function removeBlock({
  collection,
  id,
  blockIndex,
}: {
  collection: BlockCollection
  id: string
  blockIndex: number
}) {
  const cookieStore = await cookies()
  if (!(await isEditorAuthorized(cookieStore))) {
    throw new Error('Non autorisé — connexion admin requise')
  }

  const payload = await getPayload({ config })
  const payloadId = parseInt(id, 10)
  const blocks = await fetchBlocks(payload, collection, payloadId)

  if (blockIndex < 0 || blockIndex >= blocks.length) return

  blocks.splice(blockIndex, 1)
  await saveBlocks(payload, collection, payloadId, blocks)
}

// Blank templates for each block type — minimum required fields
const BLANK_BLOCKS: Record<string, Record<string, unknown>> = {
  hero: {
    blockType: 'hero',
    season: 'Nouvelle saison',
    tagline: 'Votre accroche ici',
    ctaLabel: 'Découvrir',
    ctaLink: '/fr/collections',
  },
  featuredProducts: {
    blockType: 'featuredProducts',
    title: 'Produits mis en avant',
    sourceType: 'manual',
  },
  editorialStrip: {
    blockType: 'editorialStrip',
    label: 'Nouveau bandeau',
    headline: 'Titre principal',
    subline: 'Sous-titre',
    body: 'Votre texte ici.',
    ctaLabel: 'En savoir plus',
    ctaLink: '/',
  },
  productGrid: {
    blockType: 'productGrid',
    title: 'Nos produits',
    sourceType: 'all',
  },
}

export async function addBlock({
  collection,
  id,
  afterIndex,
  blockType,
}: {
  collection: BlockCollection
  id: string
  afterIndex: number
  blockType: string
}) {
  const cookieStore = await cookies()
  if (!(await isEditorAuthorized(cookieStore))) {
    throw new Error('Non autorisé — connexion admin requise')
  }

  const blank = BLANK_BLOCKS[blockType]
  if (!blank) throw new Error(`Type de bloc inconnu : ${blockType}`)

  const payload = await getPayload({ config })
  const payloadId = parseInt(id, 10)
  const blocks = await fetchBlocks(payload, collection, payloadId)

  // Insert after the given index (or at the end)
  const insertAt = Math.min(afterIndex + 1, blocks.length)
  blocks.splice(insertAt, 0, { ...blank })

  await saveBlocks(payload, collection, payloadId, blocks)
}

export async function publishDocument({
  collection,
  id,
}: {
  collection: 'pages' | 'products' | 'globals'
  id: string
}) {
  const cookieStore = await cookies()
  if (!(await isEditorAuthorized(cookieStore))) {
    throw new Error('Non autorisé — connexion admin requise')
  }

  const payload = await getPayload({ config })

  if (collection !== 'globals') {
    await payload.update({
      collection,
      id: parseInt(id, 10),
      data: { _status: 'published' } as Record<string, unknown>,
      overrideAccess: true,
    })
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
