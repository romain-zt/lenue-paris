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

  const data: Record<string, unknown> = { [field]: value }

  await payload.update({
    collection,
    id: parseInt(id, 10),
    data,
    locale: (locale as 'fr' | 'en' | 'ru' | undefined) ?? 'fr',
    overrideAccess: true,
  })

  revalidatePath('/', 'layout')
}
