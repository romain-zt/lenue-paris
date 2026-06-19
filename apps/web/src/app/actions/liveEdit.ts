'use server'

import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { EditableCollection } from '@/lib/cms/editable'

type CookieStore = Awaited<ReturnType<typeof cookies>>

type PayloadLocale = 'fr' | 'en' | 'ru'

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
  collection: EditableCollection
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
  const payloadLocale = (locale as PayloadLocale | undefined) ?? 'fr'

  // Handle nested block fields like 'blocks.0.tagline'
  const blockMatch = field.match(/^blocks\.(\d+)\.(.+)$/)
  if (blockMatch && collection === 'pages') {
    const blockIndex = parseInt(blockMatch[1] ?? '0', 10)
    const subField = blockMatch[2] ?? ''

    const doc = await payload.findByID({
      collection: 'pages',
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
      collection: 'pages',
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
  locale?: string,
) {
  await payload.update({
    collection,
    id,
    data: { blocks } as Record<string, unknown>,
    overrideAccess: true,
    draft: true,
    ...(locale ? { locale: locale as 'fr' | 'en' | 'ru' } : {}),
  })
  revalidatePath('/', 'layout')
}

export async function reorderBlock({
  collection,
  id,
  blockIndex,
  direction,
  locales,
}: {
  collection: BlockCollection
  id: string
  blockIndex: number
  direction: 'up' | 'down'
  locales?: string[]
}) {
  const cookieStore = await cookies()
  if (!(await isEditorAuthorized(cookieStore))) {
    throw new Error('Non autorisé — connexion admin requise')
  }

  const payload = await getPayload({ config })
  const payloadId = parseInt(id, 10)
  const localesToWrite = locales && locales.length > 0 ? locales : [undefined]

  for (const locale of localesToWrite) {
    const blocks = await fetchBlocks(payload, collection, payloadId)
    const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1
    if (targetIndex < 0 || targetIndex >= blocks.length) continue

    const tmp = blocks[blockIndex]
    blocks[blockIndex] = blocks[targetIndex]!
    blocks[targetIndex] = tmp!

    await saveBlocks(payload, collection, payloadId, blocks, locale)
  }
}

export async function removeBlock({
  collection,
  id,
  blockIndex,
  locales,
}: {
  collection: BlockCollection
  id: string
  blockIndex: number
  locales?: string[]
}) {
  const cookieStore = await cookies()
  if (!(await isEditorAuthorized(cookieStore))) {
    throw new Error('Non autorisé — connexion admin requise')
  }

  const payload = await getPayload({ config })
  const payloadId = parseInt(id, 10)
  const localesToWrite = locales && locales.length > 0 ? locales : [undefined]

  for (const locale of localesToWrite) {
    const blocks = await fetchBlocks(payload, collection, payloadId)
    if (blockIndex < 0 || blockIndex >= blocks.length) continue
    blocks.splice(blockIndex, 1)
    await saveBlocks(payload, collection, payloadId, blocks, locale)
  }
}

// Starter templates — only include block types that pass Payload validation without manual input.
// Hero is excluded: it requires an image (a media relation) which cannot be set to a placeholder string.
// Editors who want a Hero block should use ↗ Admin where the media picker is available.
const BLANK_BLOCKS: Record<string, Record<string, unknown>> = {
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
  locales,
}: {
  collection: BlockCollection
  id: string
  afterIndex: number
  blockType: string
  locales?: string[]
}) {
  const cookieStore = await cookies()
  if (!(await isEditorAuthorized(cookieStore))) {
    throw new Error('Non autorisé — connexion admin requise')
  }

  const blank = BLANK_BLOCKS[blockType]
  if (!blank) throw new Error(`Type de bloc inconnu : ${blockType}`)

  const payload = await getPayload({ config })
  const payloadId = parseInt(id, 10)
  const localesToWrite = locales && locales.length > 0 ? locales : [undefined]

  for (const locale of localesToWrite) {
    const blocks = await fetchBlocks(payload, collection, payloadId)
    const insertAt = Math.min(afterIndex + 1, blocks.length)
    blocks.splice(insertAt, 0, { ...blank })
    await saveBlocks(payload, collection, payloadId, blocks, locale)
  }
}

export async function publishDocument({
  collection,
  id,
}: {
  collection: EditableCollection | 'globals'
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
