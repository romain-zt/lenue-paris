'use client'

import { useEffect, useRef, useState } from 'react'
import { useAdminEditMode } from '@/hooks/useAdminEditMode'

const BLOCK_TYPE_LABELS: Record<string, string> = {
  hero: 'Hero',
  featuredProducts: 'Featured Products',
  editorialStrip: 'Editorial Strip',
  productGrid: 'Product Grid',
}

let editModeStyleInjected = false

function injectEditModeStyle() {
  if (editModeStyleInjected || typeof document === 'undefined') return
  editModeStyleInjected = true
  const style = document.createElement('style')
  style.textContent = `
    html.admin-edit-mode [data-edit-block] {
      outline: 2px solid rgba(99,102,241,0.4);
      outline-offset: 0px;
      cursor: default;
    }
    html.admin-edit-mode [data-lp-field] {
      position: relative;
      z-index: 40;
      cursor: text;
    }
    html.admin-edit-mode [data-lp-field] [role="button"] {
      outline: 1.5px dashed rgba(99,102,241,0.55);
      outline-offset: 3px;
      border-radius: 3px;
    }
  `
  document.head.appendChild(style)
}

interface BlockOverlayProps {
  blockType: string
  blockIndex: number
  children: React.ReactNode
  /** Document ID — required to build the "Ouvrir dans l'admin" deep-link */
  docId?: string
  docCollection?: string
}

/**
 * Wraps a CMS block with a visual overlay when inside the Payload admin
 * live-preview iframe OR when public edit mode is active (`admin-edit-mode`
 * class on `<html>`). Provides:
 *  - block type badge
 *  - hover chrome with ✦ AI, Edit/Move controls (iframe) or ↗ Ouvrir dans l'admin (public)
 *
 * Zero runtime cost in production for regular shoppers.
 */
export function BlockOverlay({ blockType, blockIndex, children, docId, docCollection }: BlockOverlayProps) {
  const [isInIframe, setIsInIframe] = useState(false)
  const isEditMode = useAdminEditMode()
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsInIframe(window.parent !== window)
    injectEditModeStyle()
  }, [])

  const isActive = isInIframe || isEditMode

  if (!isActive) {
    return <>{children}</>
  }

  const label = BLOCK_TYPE_LABELS[blockType] ?? blockType
  const fieldPath = `blocks.${blockIndex}`

  function sendAIHelp() {
    // Works for both iframe (parent admin) and same-window (public FAB listener)
    const target = isInIframe ? window.parent : window
    target.postMessage({ type: 'lp:ai-field-help', path: fieldPath, label }, '*')
  }

  function focusBlock() {
    window.parent.postMessage({ type: 'payload-field-focus', path: fieldPath }, '*')
  }

  function reorder(direction: 'up' | 'down') {
    const to = direction === 'up' ? blockIndex - 1 : blockIndex + 1
    window.parent.postMessage(
      { type: 'payload-block-reorder', from: blockIndex, to },
      '*',
    )
  }

  // Construct admin deep-link for public edit mode
  const adminUrl =
    docId && docCollection
      ? `/admin/collections/${docCollection}/${docId}?field=${encodeURIComponent(fieldPath)}`
      : null

  return (
    <div
      ref={ref}
      data-block-type={blockType}
      data-block-index={blockIndex}
      data-edit-block={fieldPath}
      data-payload-path={fieldPath}
      data-payload-block={blockType}
      data-payload-id={docId ?? ''}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative' }}
    >
      {children}

      {/* Block type badge — top-left, always visible in overlay mode */}
      <div
        aria-hidden="true"
        style={{
          alignItems: 'center',
          background: 'rgba(15,15,15,0.72)',
          backdropFilter: 'blur(6px)',
          borderRadius: '0 0 6px 0',
          color: '#fff',
          display: 'flex',
          fontSize: 10,
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 600,
          gap: 5,
          left: 0,
          letterSpacing: '0.06em',
          padding: '3px 8px 3px 6px',
          pointerEvents: 'none',
          position: 'absolute',
          textTransform: 'uppercase',
          top: 0,
          userSelect: 'none',
          zIndex: 30,
        }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
          <rect width="3.5" height="3.5" fill="currentColor" opacity="0.7" />
          <rect x="4.5" width="3.5" height="3.5" fill="currentColor" opacity="0.7" />
          <rect y="4.5" width="3.5" height="3.5" fill="currentColor" opacity="0.7" />
          <rect x="4.5" y="4.5" width="3.5" height="3.5" fill="currentColor" opacity="0.7" />
        </svg>
        {label}
      </div>

      {/* Hover chrome — outline + controls */}
      {isHovered && (
        <>
          <div
            aria-hidden="true"
            style={{
              border: '2px solid rgba(99,102,241,0.7)',
              borderRadius: 2,
              bottom: 0,
              left: 0,
              pointerEvents: 'none',
              position: 'absolute',
              right: 0,
              top: 0,
              zIndex: 29,
            }}
          />

          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: 2,
              position: 'absolute',
              right: 8,
              top: 6,
              zIndex: 31,
            }}
          >
            {/* ✦ AI — works in both iframe and public edit mode */}
            <OverlayButton title="Modifier avec l'IA" onClick={sendAIHelp}>
              ✦
            </OverlayButton>

            {/* Admin live-preview iframe controls */}
            {isInIframe && (
              <OverlayButton
                title={`Modifier ${label} (bloc ${blockIndex})`}
                onClick={focusBlock}
                primary
              >
                Modifier
              </OverlayButton>
            )}
            {isInIframe && blockIndex > 0 && (
              <OverlayButton title="Monter" onClick={() => reorder('up')}>↑</OverlayButton>
            )}
            {isInIframe && (
              <OverlayButton title="Descendre" onClick={() => reorder('down')}>↓</OverlayButton>
            )}

            {/* Public edit mode — deep-link to admin */}
            {isEditMode && !isInIframe && adminUrl && (
              <a
                href={adminUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Ouvrir dans l'admin"
                onClick={(e) => e.stopPropagation()}
                style={{
                  alignItems: 'center',
                  background: 'rgba(15,15,15,0.72)',
                  backdropFilter: 'blur(6px)',
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  height: 26,
                  justifyContent: 'center',
                  lineHeight: 1,
                  padding: '0 8px',
                  textDecoration: 'none',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                ↗ Admin
              </a>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function OverlayButton({
  children,
  onClick,
  title,
  primary,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  primary?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      style={{
        alignItems: 'center',
        background: primary ? 'rgba(99,102,241,0.9)' : 'rgba(15,15,15,0.72)',
        backdropFilter: 'blur(6px)',
        border: 'none',
        borderRadius: 4,
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        fontWeight: 600,
        gap: 4,
        height: 26,
        justifyContent: 'center',
        letterSpacing: '0.04em',
        lineHeight: 1,
        minWidth: primary ? 52 : 26,
        padding: '0 8px',
        userSelect: 'none',
      }}
    >
      {children}
    </button>
  )
}
