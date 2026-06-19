'use server'

import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

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
  if (!cookieStore.get('payload-token')) {
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

export async function publishDocument({
  collection,
  id,
}: {
  collection: 'pages' | 'products' | 'globals'
  id: string
}) {
  const cookieStore = await cookies()
  if (!cookieStore.get('payload-token')) {
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
