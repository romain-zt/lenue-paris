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
        <article
          style={{
            maxWidth: 720,
            margin: '0 auto',
            padding: '3rem 1.5rem',
          }}
        >
          {page.title && (
            <h1
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                fontWeight: 300,
                letterSpacing: '-0.02em',
                marginBottom: '2rem',
              }}
            >
              {typeof page.title === 'string' ? page.title : ''}
            </h1>
          )}
          {page.body && (
            <p
              style={{
                fontSize: '1.0625rem',
                lineHeight: 1.75,
                whiteSpace: 'pre-wrap',
              }}
            >
              {page.body}
            </p>
          )}
        </article>
      )}
      <InlineEditor />
    </main>
  )
}
