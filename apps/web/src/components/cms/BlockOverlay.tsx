'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { reorderBlock, removeBlock, addBlock } from '@/app/actions/liveEdit'

const BLOCK_TYPE_LABELS: Record<string, string> = {
  hero: 'Hero',
  featuredProducts: 'Produits mis en avant',
  editorialStrip: 'Bandeau éditorial',
  productGrid: 'Grille produits',
}

// Human-readable names shown in the "Add a block" picker
const ADDABLE_BLOCKS: { type: string; label: string; description: string }[] = [
  { type: 'hero', label: 'Hero', description: 'Grande image + accroche + CTA' },
  { type: 'featuredProducts', label: 'Produits mis en avant', description: 'Sélection manuelle ou par collection' },
  { type: 'editorialStrip', label: 'Bandeau éditorial', description: 'Image + texte + lien' },
  { type: 'productGrid', label: 'Grille produits', description: 'Tous les produits ou par collection' },
]

let editModeStyleInjected = false

function injectEditModeStyle() {
  if (editModeStyleInjected || typeof document === 'undefined') return
  editModeStyleInjected = true
  const style = document.createElement('style')
  style.textContent = `
    html.admin-edit-mode [data-edit-block] {
      outline: 2px solid rgba(99,102,241,0.4);
      outline-offset: 0px;
      cursor: pointer;
    }
    @keyframes block-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(234,179,8,0.7); }
      70%  { box-shadow: 0 0 0 12px rgba(234,179,8,0); }
      100% { box-shadow: 0 0 0 0 rgba(234,179,8,0); }
    }
    .block-pulse-anim {
      animation: block-pulse 0.8s ease-out 2;
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
  docCollection?: 'pages' | 'products'
}

/**
 * Wraps a CMS block with a visual overlay when inside the Payload admin
 * live-preview iframe OR when public edit mode is active (`admin-edit-mode`
 * class on `<html>`). Provides:
 *  - block type badge
 *  - hover chrome with ✦ AI, Edit/Move controls (iframe) or structural editing (public)
 *
 * Zero runtime cost in production for regular shoppers.
 */
export function BlockOverlay({ blockType, blockIndex, children, docId, docCollection }: BlockOverlayProps) {
  const [isInIframe, setIsInIframe] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsInIframe(window.parent !== window)
    setIsEditMode(document.documentElement.classList.contains('admin-edit-mode'))
    injectEditModeStyle()

    const handleEditMode = (e: Event) => {
      setIsEditMode((e as CustomEvent<{ enabled: boolean }>).detail.enabled)
    }
    document.addEventListener('admin-edit-mode', handleEditMode)
    return () => document.removeEventListener('admin-edit-mode', handleEditMode)
  }, [])

  const isActive = isInIframe || isEditMode

  if (!isActive) {
    return <>{children}</>
  }

  const label = BLOCK_TYPE_LABELS[blockType] ?? blockType
  const fieldPath = `blocks.${blockIndex}`

  function sendAIHelp() {
    const target = isInIframe ? window.parent : window
    target.postMessage({ type: 'lp:ai-field-help', path: fieldPath, label }, '*')
  }

  function focusBlock() {
    window.parent.postMessage({ type: 'payload-field-focus', path: fieldPath }, '*')
  }

  function reorderIframe(direction: 'up' | 'down') {
    const to = direction === 'up' ? blockIndex - 1 : blockIndex + 1
    window.parent.postMessage({ type: 'payload-block-reorder', from: blockIndex, to }, '*')
  }

  /** Dispatch the event that updates the FAB strip + banner, then pulse this block */
  function notifyMutation(actionLabel: string) {
    window.dispatchEvent(
      new CustomEvent('lp:field-patched', {
        detail: { label: actionLabel, field: fieldPath },
      }),
    )
    // Auto-scroll into view and pulse gold
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      ref.current?.classList.add('block-pulse-anim')
      ref.current?.addEventListener(
        'animationend',
        () => ref.current?.classList.remove('block-pulse-anim'),
        { once: true },
      )
    }, 300)
  }

  function handleReorder(direction: 'up' | 'down') {
    if (!docId || !docCollection) return
    startTransition(async () => {
      await reorderBlock({ collection: docCollection, id: docId, blockIndex, direction })
      notifyMutation(direction === 'up' ? `${label} · déplacé vers le haut` : `${label} · déplacé vers le bas`)
      window.location.reload()
    })
  }

  function handleRemove() {
    if (!docId || !docCollection) return
    startTransition(async () => {
      await removeBlock({ collection: docCollection, id: docId, blockIndex })
      notifyMutation(`${label} · supprimé`)
      window.location.reload()
    })
  }

  function handleAdd(newBlockType: string) {
    if (!docId || !docCollection) return
    setShowAddModal(false)
    startTransition(async () => {
      await addBlock({ collection: docCollection, id: docId, afterIndex: blockIndex, blockType: newBlockType })
      const newLabel = BLOCK_TYPE_LABELS[newBlockType] ?? newBlockType
      notifyMutation(`${newLabel} · section ajoutée`)
      window.location.reload()
    })
  }

  // Construct admin deep-link for public edit mode
  const adminUrl =
    docId && docCollection
      ? `/admin/collections/${docCollection}/${docId}?field=${encodeURIComponent(fieldPath)}`
      : null

  const canStructuralEdit = isEditMode && !isInIframe && !!docId && !!docCollection

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
      onMouseLeave={() => {
        setIsHovered(false)
        setDeleteConfirm(false)
      }}
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
        {isPending && <span style={{ opacity: 0.6, marginLeft: 4 }}>…</span>}
      </div>

      {/* Hover chrome — outline + controls */}
      {isHovered && !isPending && (
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
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              maxWidth: 'calc(100% - 120px)',
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
              <OverlayButton title="Monter" onClick={() => reorderIframe('up')}>↑</OverlayButton>
            )}
            {isInIframe && (
              <OverlayButton title="Descendre" onClick={() => reorderIframe('down')}>↓</OverlayButton>
            )}

            {/* Public structural editing controls */}
            {canStructuralEdit && blockIndex > 0 && (
              <OverlayButton title="Monter cette section" onClick={() => handleReorder('up')}>↑ Monter</OverlayButton>
            )}
            {canStructuralEdit && (
              <OverlayButton title="Descendre cette section" onClick={() => handleReorder('down')}>↓ Descendre</OverlayButton>
            )}
            {canStructuralEdit && (
              <OverlayButton title="Ajouter une section après" onClick={() => { setShowAddModal(true); setDeleteConfirm(false) }}>
                ＋ Ajouter
              </OverlayButton>
            )}
            {canStructuralEdit && !deleteConfirm && (
              <OverlayButton title="Supprimer cette section" onClick={() => setDeleteConfirm(true)} danger>
                ✕
              </OverlayButton>
            )}
            {canStructuralEdit && deleteConfirm && (
              <>
                <span style={{
                  color: '#fca5a5',
                  fontSize: 10,
                  fontFamily: 'system-ui, sans-serif',
                  background: 'rgba(15,15,15,0.9)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}>
                  Retirer cette section ?
                </span>
                <OverlayButton title="Confirmer la suppression" onClick={handleRemove} danger>
                  Supprimer
                </OverlayButton>
                <OverlayButton title="Annuler" onClick={() => setDeleteConfirm(false)}>
                  Annuler
                </OverlayButton>
              </>
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

      {/* Add block modal */}
      {showAddModal && (
        <div
          style={{
            background: 'rgba(10,10,10,0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
            fontFamily: 'system-ui, sans-serif',
            left: '50%',
            maxWidth: 320,
            padding: 16,
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            width: 'calc(100vw - 32px)',
            zIndex: 50,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ alignItems: 'center', display: 'flex', gap: 8, marginBottom: 12 }}>
            <span style={{ color: '#a5b4fc', flex: 1, fontSize: 13, fontWeight: 700 }}>
              Ajouter une section · brouillon uniquement
            </span>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
                padding: 2,
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ADDABLE_BLOCKS.map((b) => (
              <button
                key={b.type}
                type="button"
                onClick={() => handleAdd(b.type)}
                style={{
                  alignItems: 'flex-start',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  padding: '10px 12px',
                  textAlign: 'left',
                  transition: 'background 0.12s',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.18)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600 }}>{b.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{b.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OverlayButton({
  children,
  onClick,
  title,
  primary,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  primary?: boolean
  danger?: boolean
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
        background: primary
          ? 'rgba(99,102,241,0.9)'
          : danger
            ? 'rgba(239,68,68,0.8)'
            : 'rgba(15,15,15,0.72)',
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
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}
