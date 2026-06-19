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
