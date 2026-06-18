import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { setRequestLocale } from 'next-intl/server'
import { GenericPageContent } from './GenericPageContent'
import { getPageDocument } from '@/lib/cms/queries'
import { buildPageMetadata } from '@/lib/seo/metadata'
import type { ContentLocale } from '@/lib/cms/types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params
  const { isEnabled: isDraft } = await draftMode()
  const page = await getPageDocument(slug, locale as ContentLocale, { draft: isDraft })
  if (!page) return {}

  return buildPageMetadata({
    title: typeof page.title === 'string' ? page.title : String(page.title),
    description: typeof page.body === 'string' ? page.body.slice(0, 160) : '',
    locale,
    pathname: `/${slug}`,
  })
}

export default async function GenericPage({ params }: PageProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const { isEnabled: isDraft } = await draftMode()
  const page = await getPageDocument(slug, locale as ContentLocale, { draft: isDraft })

  if (!page) notFound()

  return (
    <GenericPageContent
      initialPage={JSON.parse(JSON.stringify(page))}
      locale={locale as ContentLocale}
    />
  )
}
