'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { RenderBlocks } from '@/components/cms/RenderBlocks'
import { InlineEditor } from '@/components/cms/InlineEditor'
import { EditableField } from '@/components/cms/EditableField'
import { enrichFeaturedBlock, mapHomePageBlocks } from '@/lib/cms/blocks'
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
  const blocks = mappedBlocks.map((block) =>
    block.blockType === 'featuredProducts' ? enrichFeaturedBlock(block, locale, {
      season: '',
      viewFullCollectionLabel: '',
      outOfStockBadge: '',
    }) : block,
  )

  const docId = String(page.id)
  const titleStr = typeof page.title === 'string' ? page.title : ''
  const bodyStr = typeof page.body === 'string' ? page.body : ''

  return (
    <main>
      {hasBlocks ? (
        <RenderBlocks
          blocks={blocks}
          quote=""
          docId={docId}
          docCollection="pages"
          locale={locale}
        />
      ) : (
        <article className="mx-auto max-w-[720px] px-6 py-12">
          {titleStr ? (
            <h1 className="mb-8 font-serif text-3xl font-light tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
              <EditableField
                collection="pages"
                id={docId}
                field="title"
                fieldLabel="Titre"
                currentValue={titleStr}
                locale={locale}
              >
                {titleStr}
              </EditableField>
            </h1>
          ) : null}
          {bodyStr ? (
            <div className="whitespace-pre-wrap text-base leading-relaxed text-stone-700 sm:text-lg">
              <EditableField
                collection="pages"
                id={docId}
                field="body"
                fieldLabel="Corps du texte"
                currentValue={bodyStr}
                locale={locale}
                multiline
              >
                {bodyStr}
              </EditableField>
            </div>
          ) : null}
        </article>
      )}
      <InlineEditor />
    </main>
  )
}
