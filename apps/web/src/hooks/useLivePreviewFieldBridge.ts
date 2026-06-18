'use client'

import { useEffect } from 'react'

/**
 * P1 — Click-to-field bridge for live preview.
 *
 * When the storefront is rendered inside the Payload admin iframe, clicking any
 * element with `data-payload-path="<fieldPath>"` sends a postMessage to the
 * parent window. The `CustomLivePreview` admin component listens for this
 * message and scrolls the form to the corresponding field.
 *
 * Block-level paths (e.g. `blocks.0`) get a thicker indigo outline on hover to
 * distinguish them from field-level paths (e.g. `blocks.0.tagline`).
 *
 * Mount this hook once at the top of any page used in live preview.
 */
export function useLivePreviewFieldBridge(): void {
  useEffect(() => {
    const isInIframe = typeof window !== 'undefined' && window.parent !== window
    if (!isInIframe) return

    /**
     * Returns true when the path targets a block row (e.g. `blocks.0`)
     * rather than an individual field (e.g. `blocks.0.tagline`).
     */
    function isBlockPath(path: string): boolean {
      // Matches "blocks.<integer>" with nothing after
      return /^blocks\.\d+$/.test(path)
    }

    const handleClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-payload-path]',
      )
      if (!target) return

      const path = target.getAttribute('data-payload-path')
      if (!path) return

      event.preventDefault()
      event.stopPropagation()

      window.parent.postMessage(
        { type: 'payload-field-focus', path },
        '*',
      )

      // Brief visual feedback on the clicked element
      const color = isBlockPath(path)
        ? 'rgba(99,102,241,0.7)'   // indigo for block rows
        : 'rgba(59,130,246,0.6)'   // blue for individual fields
      target.style.outline = `2px solid ${color}`
      target.style.outlineOffset = '2px'
      setTimeout(() => {
        target.style.outline = ''
        target.style.outlineOffset = ''
      }, 800)
    }

    const handleMouseOver = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-payload-path]',
      )
      if (!target) return

      const path = target.getAttribute('data-payload-path') ?? ''
      const isBlock = isBlockPath(path)

      target.style.cursor = 'pointer'
      // Block rows get a slightly thicker dashed indigo border; fields get blue
      target.style.outline = isBlock
        ? '2px dashed rgba(99,102,241,0.4)'
        : '1px dashed rgba(59,130,246,0.35)'
      target.style.outlineOffset = '2px'
    }

    const handleMouseOut = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-payload-path]',
      )
      if (!target) return
      target.style.cursor = ''
      target.style.outline = ''
      target.style.outlineOffset = ''
    }

    document.addEventListener('click', handleClick, true)
    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)

    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
    }
  }, [])
}
