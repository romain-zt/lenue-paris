'use client'

import { useEffect, useRef, useState } from 'react'

const BLOCK_TYPE_LABELS: Record<string, string> = {
  hero: 'Hero',
  featuredProducts: 'Featured Products',
  editorialStrip: 'Editorial Strip',
  productGrid: 'Product Grid',
}

interface BlockOverlayProps {
  blockType: string
  blockIndex: number
  children: React.ReactNode
}

/**
 * Wraps a CMS block with a visual overlay only when rendered inside the Payload
 * admin live-preview iframe. Provides:
 *  - block type badge (always visible)
 *  - hover chrome: Edit / Move Up / Move Down controls
 *  - click "Edit" → postMessage payload-field-focus to parent admin
 *  - click "Move" → postMessage payload-block-reorder to parent admin
 *
 * When NOT in an iframe this component is a transparent passthrough — zero
 * runtime cost in production / regular storefront.
 */
export function BlockOverlay({ blockType, blockIndex, children }: BlockOverlayProps) {
  const [isInIframe, setIsInIframe] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsInIframe(window.parent !== window)
    setIsEditMode(document.documentElement.classList.contains('admin-edit-mode'))

    const handleEditMode = (e: Event) => {
      setIsEditMode((e as CustomEvent<{ enabled: boolean }>).detail.enabled)
    }
    document.addEventListener('admin-edit-mode', handleEditMode)
    return () => document.removeEventListener('admin-edit-mode', handleEditMode)
  }, [])

  const isActive = isInIframe || isEditMode

  if (!isActive) {
    // Passthrough — no overhead outside live preview / edit mode
    return <>{children}</>
  }

  const label = BLOCK_TYPE_LABELS[blockType] ?? blockType
  const fieldPath = `blocks.${blockIndex}`

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

  return (
    <div
      ref={ref}
      data-block-type={blockType}
      data-block-index={blockIndex}
      data-payload-path={fieldPath}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative' }}
    >
      {children}

      {/* Block type badge — top-left corner, always visible in preview mode */}
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
          {/* Inset outline */}
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

          {/* Controls toolbar — top-right */}
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
            <OverlayButton
              title="Demander à l'IA"
              onClick={() => {
                window.parent.postMessage(
                  { type: 'lp:ai-field-help', path: fieldPath, label },
                  '*',
                )
              }}
            >
              ✦
            </OverlayButton>
            {isInIframe && (
              <OverlayButton
                title={`Edit ${label} (block ${blockIndex})`}
                onClick={focusBlock}
                primary
              >
                Edit
              </OverlayButton>
            )}
            {isInIframe && blockIndex > 0 && (
              <OverlayButton title="Move block up" onClick={() => reorder('up')}>
                ↑
              </OverlayButton>
            )}
            {isInIframe && (
              <OverlayButton title="Move block down" onClick={() => reorder('down')}>
                ↓
              </OverlayButton>
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
