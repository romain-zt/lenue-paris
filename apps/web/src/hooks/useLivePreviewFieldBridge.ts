'use client'

import { useEffect } from 'react'
import {
  LP_OPEN_EDITOR_EVENT,
  NON_EDITABLE_SUFFIXES,
  type InlineEditorPayload,
} from '@/components/cms/InlineEditor'

// Re-export so consumers can import from one place
export { LP_OPEN_EDITOR_EVENT }

// Fields that require inline-edit to fall through to admin focus
const MEDIA_RELATION_RE = /\.(heroImage|heroVideo|image|mainImage|cover|products|collection)$/

/**
 * Returns true when the path targets a block row (e.g. `blocks.0`)
 * rather than an individual field (e.g. `blocks.0.tagline`).
 */
function isBlockPath(path: string): boolean {
  return /^blocks\.\d+$/.test(path)
}

function getFieldType(path: string, textContent: string): InlineEditorPayload['fieldType'] {
  const last = path.split('.').pop() ?? ''
  if (NON_EDITABLE_SUFFIXES.has(last) || MEDIA_RELATION_RE.test(path)) return 'media'
  if (textContent.length > 80) return 'textarea'
  return 'text'
}

/** Fire the custom event that `InlineEditor` listens to. */
function openInlineEditor(target: HTMLElement, path: string) {
  const rect = target.getBoundingClientRect()
  const rawValue = target.textContent?.trim() ?? ''
  const fieldType = getFieldType(path, rawValue)

  const detail: InlineEditorPayload = {
    path,
    value: rawValue,
    fieldType,
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }

  document.dispatchEvent(new CustomEvent(LP_OPEN_EDITOR_EVENT, { detail }))
}

/**
 * P1 — Click-to-field bridge + inline editor trigger for live preview.
 *
 * Behaviours (only active when rendered inside the Payload admin iframe):
 *
 * 1. Hover  → dashed outline on `[data-payload-path]` elements
 *             - indigo (thick) for block-level paths
 *             - blue  (thin)  for field-level paths
 *
 * 2. Click  → postMessage `payload-field-focus` to parent admin (scroll to field)
 *
 * 3. Right-click (desktop) or Long-press >500ms (mobile) → open `InlineEditor`
 *    floating panel for direct in-preview editing
 *
 * Mount this hook once at the top of any page used in live preview.
 */
export function useLivePreviewFieldBridge(): void {
  useEffect(() => {
    const isInIframe = typeof window !== 'undefined' && window.parent !== window
    if (!isInIframe) return

    // ── Click → focus field in admin ────────────────────────────────────────
    const handleClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-payload-path]',
      )
      if (!target) return

      const path = target.getAttribute('data-payload-path')
      if (!path) return

      event.preventDefault()
      event.stopPropagation()

      window.parent.postMessage({ type: 'payload-field-focus', path }, '*')

      const color = isBlockPath(path)
        ? 'rgba(99,102,241,0.7)'
        : 'rgba(59,130,246,0.6)'
      target.style.outline = `2px solid ${color}`
      target.style.outlineOffset = '2px'
      setTimeout(() => {
        target.style.outline = ''
        target.style.outlineOffset = ''
      }, 800)
    }

    // ── Right-click → open inline editor ────────────────────────────────────
    const handleContextMenu = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-payload-path]',
      )
      if (!target) return

      const path = target.getAttribute('data-payload-path')
      if (!path || isBlockPath(path)) return // block rows → skip (not a leaf field)

      event.preventDefault()
      event.stopPropagation()
      openInlineEditor(target, path)
    }

    // ── Hover outline ────────────────────────────────────────────────────────
    const handleMouseOver = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-payload-path]',
      )
      if (!target) return
      const path = target.getAttribute('data-payload-path') ?? ''
      target.style.cursor = 'pointer'
      target.style.outline = isBlockPath(path)
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

    // ── Long-press on mobile → open inline editor ────────────────────────────
    let longPressTimer: ReturnType<typeof setTimeout> | null = null
    let longPressTarget: HTMLElement | null = null

    const handleTouchStart = (event: TouchEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-payload-path]',
      )
      if (!target) return

      const path = target.getAttribute('data-payload-path')
      if (!path || isBlockPath(path)) return

      longPressTarget = target
      longPressTimer = setTimeout(() => {
        openInlineEditor(target, path)
        longPressTarget = null
        longPressTimer = null
      }, 520)
    }

    const cancelLongPress = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
      longPressTarget = null
    }

    document.addEventListener('click', handleClick, true)
    document.addEventListener('contextmenu', handleContextMenu, true)
    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', cancelLongPress)
    document.addEventListener('touchmove', cancelLongPress, { passive: true })

    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('contextmenu', handleContextMenu, true)
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', cancelLongPress)
      document.removeEventListener('touchmove', cancelLongPress)
    }
  }, [])
}
