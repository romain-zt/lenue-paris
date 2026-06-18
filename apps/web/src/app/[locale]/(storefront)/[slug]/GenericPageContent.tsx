'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { RenderBlocks } from '@/components/cms/RenderBlocks'
import { InlineEditor } from '@/components/cms/InlineEditor'
import { mapHomePageBlocks } from '@/lib/cms/blocks'
import { getPreviewSiteUrl } from '@/lib/cms/generatePreviewPath'
import { useLivePreviewFieldBridge } from '@/hooks/useLivePreviewFieldBridge'
import type { Page as PayloadPage } from '@/payload-types'
import type { ContentLocale } from '@/lib/cms/types'

interface GenericPageContentProps {
  initialPage: PayloadPage
  locale: ContentLocale
}

export function GenericPageContent({ initialPage, locale }: GenericPageContentProps) {
  const serverURL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || getPreviewSiteUrl()

  useLivePreviewFieldBridge()

  const { data: page } = useLivePreview<PayloadPage>({
    initialData: initialPage,
    serverURL,
    depth: 3,
  })

  const hasBlocks = Array.isArray(page.blocks) && page.blocks.length > 0
  const mappedBlocks = hasBlocks ? mapHomePageBlocks(page.blocks) : []

  return (
    <main>
      {hasBlocks ? (
        <RenderBlocks blocks={mappedBlocks} quote="" />
      ) : (
        <article className="mx-auto max-w-[720px] px-6 py-12">
          {page.title && (
            <h1 className="mb-8 font-serif text-3xl font-light tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
              {typeof page.title === 'string' ? page.title : ''}
            </h1>
          )}
          {page.body && (
            <p className="whitespace-pre-wrap text-base leading-relaxed text-stone-700 sm:text-lg">
              {page.body}
            </p>
          )}
        </article>
      )}
      <InlineEditor />
    </main>
  )
}
