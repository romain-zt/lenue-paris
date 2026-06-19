'use client'

import { useEffect, useRef, useState } from 'react'

// Fields that cannot be edited inline (media/relationship) — they get an
// "Open in admin" fallback instead.
export const NON_EDITABLE_SUFFIXES = new Set([
  'heroImage',
  'heroVideo',
  'image',
  'mainImage',
  'cover',
  'products',
  'collection',
])

const FIELD_LABELS: Record<string, string> = {
  season: 'Season',
  tagline: 'Tagline',
  ctaLabel: 'CTA label',
  ctaLink: 'CTA link',
  label: 'Label',
  headline: 'Headline',
  subline: 'Subline',
  body: 'Body',
  title: 'Title',
  viewCollectionLabel: 'Collection label',
}

function getFieldLabel(path: string) {
  const last = path.split('.').pop() ?? path
  return FIELD_LABELS[last] ?? last
}

export interface InlineEditorPayload {
  path: string
  value: string
  fieldType: 'text' | 'textarea' | 'media' | 'relation'
  // Viewport-relative coordinates inside the iframe
  top: number
  left: number
  width: number
  height: number
}

export const LP_OPEN_EDITOR_EVENT = 'lp:open-editor'

export function InlineEditor() {
  const [state, setState] = useState<InlineEditorPayload | null>(null)
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  // Only mounts behaviour inside the admin iframe
  useEffect(() => {
    if (typeof window === 'undefined' || window.parent === window) return

    const open = (e: Event) => {
      const payload = (e as CustomEvent<InlineEditorPayload>).detail
      setState(payload)
      setDraft(payload.value)
    }

    document.addEventListener(LP_OPEN_EDITOR_EVENT, open)
    return () => document.removeEventListener(LP_OPEN_EDITOR_EVENT, open)
  }, [])

  // Auto-focus when panel opens
  useEffect(() => {
    if (!state || !inputRef.current) return
    const el = inputRef.current
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    })
  }, [state?.path]) // re-run when a new field opens

  function close() {
    setState(null)
    setSaved(false)
  }

  function save() {
    if (!state) return
    window.parent.postMessage(
      { type: 'payload-field-update', path: state.path, value: draft },
      '*',
    )
    setSaved(true)
    setTimeout(close, 700)
  }

  function openInAdmin() {
    if (!state) return
    window.parent.postMessage(
      { type: 'payload-field-focus', path: state.path },
      '*',
    )
    close()
  }

  if (!state) return null

  const label = getFieldLabel(state.path)
  const isNonEditable = state.fieldType === 'media' || state.fieldType === 'relation'

  // ─── Position panel near the target, clamped to viewport ──────────────────
  const PANEL_W = 320
  const GAP = 10
  const vw = typeof window !== 'undefined' ? window.innerWidth : 375
  const vh = typeof window !== 'undefined' ? window.innerHeight : 667

  let panelLeft = Math.min(state.left, vw - PANEL_W - GAP)
  panelLeft = Math.max(GAP, panelLeft)

  // Prefer below, flip above if no room
  let panelTop = state.top + state.height + GAP
  const estimatedH = isNonEditable ? 80 : state.fieldType === 'textarea' ? 210 : 130
  if (panelTop + estimatedH > vh - GAP) {
    panelTop = state.top - estimatedH - GAP
  }
  panelTop = Math.max(GAP, panelTop)

  return (
    <>
      {/* Full-screen invisible backdrop to catch outside clicks */}
      <div
        aria-hidden="true"
        onClick={close}
        style={{
          bottom: 0,
          left: 0,
          position: 'fixed',
          right: 0,
          top: 0,
          zIndex: 99998,
        }}
      />

      {/* Highlight ring on the target element */}
      <div
        aria-hidden="true"
        style={{
          border: '2px solid #6366f1',
          borderRadius: 2,
          height: state.height,
          left: state.left,
          pointerEvents: 'none',
          position: 'fixed',
          top: state.top,
          width: state.width,
          zIndex: 99997,
        }}
      />

      {/* Editor panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${label}`}
        style={{
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          left: panelLeft,
          padding: '10px 12px 12px',
          position: 'fixed',
          top: panelTop,
          width: PANEL_W,
          zIndex: 99999,
        }}
      >
        {/* Header */}
        <div
          style={{
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: 6,
            marginBottom: 10,
            paddingBottom: 8,
          }}
        >
          <span style={{ color: '#6366f1', fontSize: 12, lineHeight: 1 }}>✏</span>
          <span
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
          <code
            style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 3,
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'monospace',
              fontSize: 9,
              marginLeft: 'auto',
              padding: '1px 5px',
            }}
          >
            {state.path}
          </code>
          <button
            type="button"
            onClick={close}
            title="Cancel (Esc)"
            style={{
              alignItems: 'center',
              background: 'none',
              border: 'none',
              borderRadius: 3,
              color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              display: 'flex',
              fontSize: 14,
              height: 20,
              justifyContent: 'center',
              lineHeight: 1,
              padding: 0,
              width: 20,
            }}
          >
            ×
          </button>
        </div>

        {/* Media / relation → no inline edit */}
        {isNonEditable ? (
          <div
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            Media and relationship fields can&apos;t be edited inline.{' '}
            <button
              type="button"
              onClick={openInAdmin}
              style={{
                background: 'none',
                border: 'none',
                color: '#818cf8',
                cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 12,
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Open in admin →
            </button>
          </div>
        ) : state.fieldType === 'textarea' ? (
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') close()
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save()
            }}
            rows={4}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 5,
              boxSizing: 'border-box',
              color: '#fff',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 13,
              lineHeight: 1.55,
              outline: 'none',
              padding: '8px 10px',
              resize: 'vertical',
              transition: 'border-color 0.15s',
              width: '100%',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          />
        ) : (
            <input
            ref={inputRef as unknown as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') close()
              if (e.key === 'Enter') save()
            }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 5,
              boxSizing: 'border-box',
              color: '#fff',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 13,
              outline: 'none',
              padding: '8px 10px',
              transition: 'border-color 0.15s',
              width: '100%',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          />
        )}

        {/* Footer actions */}
        {!isNonEditable && (
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: 6,
              marginTop: 8,
            }}
          >
            <span
              style={{
                color: 'rgba(255,255,255,0.2)',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 10,
              }}
            >
              {state.fieldType === 'textarea' ? '⌘↵ save' : '↵ save'} · Esc cancel
            </span>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              title="Demander à l'IA"
              onClick={() => {
                window.parent.postMessage(
                  { type: 'lp:ai-field-help', path: state.path, label, value: draft },
                  '*',
                )
                close()
              }}
              style={{
                alignItems: 'center',
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 4,
                color: '#a5b4fc',
                cursor: 'pointer',
                display: 'flex',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 11,
                fontWeight: 600,
                gap: 3,
                height: 28,
                padding: '0 10px',
              }}
            >
              ✦ IA
            </button>
            <button
              type="button"
              onClick={close}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: 'none',
                borderRadius: 4,
                color: 'rgba(255,255,255,0.55)',
                cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 12,
                fontWeight: 500,
                height: 28,
                padding: '0 10px',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saved}
              style={{
                background: saved ? '#22c55e' : '#6366f1',
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                cursor: saved ? 'default' : 'pointer',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                height: 28,
                padding: '0 14px',
                transition: 'background 0.15s',
              }}
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
