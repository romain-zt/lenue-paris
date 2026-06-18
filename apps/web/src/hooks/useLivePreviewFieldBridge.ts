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
 * Mount this hook once at the top of any page used in live preview.
 */
export function useLivePreviewFieldBridge(): void {
  useEffect(() => {
    const isInIframe = typeof window !== 'undefined' && window.parent !== window
    if (!isInIframe) return

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
      target.style.outline = '2px solid rgba(59,130,246,0.5)'
      target.style.outlineOffset = '2px'
      target.style.cursor = 'pointer'
      setTimeout(() => {
        target.style.outline = ''
        target.style.outlineOffset = ''
      }, 800)
    }

    // Highlight editable elements on hover so editors know they're clickable
    const handleMouseOver = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-payload-path]',
      )
      if (!target) return
      target.style.cursor = 'pointer'
      target.style.outline = '1px dashed rgba(59,130,246,0.35)'
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
