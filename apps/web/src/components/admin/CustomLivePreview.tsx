'use client'

import { useAllFormFields } from '@payloadcms/ui'
import { useDocumentEvents } from '@payloadcms/ui'
import { useDocumentInfo } from '@payloadcms/ui'
import { useLivePreviewContext } from '@payloadcms/ui'
import { useLocale } from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const INSET_PX = 16
const HANDLE_PX = 6
const MIN_PANEL_PX = 300
const MIN_FORM_PX = 280
const DEFAULT_PANEL_PX = 500

// ─── Breakpoint selector ──────────────────────────────────────────────────────

const BreakpointBar: React.FC<{
  onFullscreen: () => void
  isFullscreen: boolean
}> = ({ onFullscreen, isFullscreen }) => {
  const { breakpoint, breakpoints, setBreakpoint } = useLivePreviewContext()

  useEffect(() => {
    setBreakpoint('mobile')
  }, [])

  const allBreakpoints = [
    { label: 'Responsive', name: 'responsive' },
    ...(breakpoints ?? []).filter((bp: { name: string; label?: string }) => bp.name !== 'responsive'),
  ]

  return (
    <div
      style={{
        alignItems: 'center',
        background: 'var(--theme-bg)',
        borderBottom: '1px solid var(--theme-elevation-100)',
        display: 'flex',
        flexShrink: 0,
        gap: 8,
        padding: '6px 12px',
      }}
    >
      <select
        onChange={(e) => setBreakpoint(e.target.value)}
        value={breakpoint ?? 'responsive'}
        style={{
          background: 'var(--theme-elevation-100)',
          border: 'none',
          borderRadius: 4,
          color: 'var(--theme-text)',
          cursor: 'pointer',
          fontSize: 12,
          padding: '4px 8px',
        }}
      >
        {allBreakpoints.map((bp) => (
          <option key={bp.name} value={bp.name}>
            {bp.label}
          </option>
        ))}
      </select>

      <span
        style={{
          color: 'var(--theme-elevation-500)',
          flex: 1,
          fontSize: 11,
        }}
      >
        Click any field in the preview to focus it in the form
      </span>

      <button
        type="button"
        title={isFullscreen ? 'Exit fullscreen preview' : 'Fullscreen preview'}
        onClick={onFullscreen}
        style={{
          alignItems: 'center',
          background: isFullscreen ? 'var(--theme-success-500, #22c55e)' : 'var(--theme-elevation-150)',
          border: 'none',
          borderRadius: 4,
          color: isFullscreen ? '#fff' : 'var(--theme-text)',
          cursor: 'pointer',
          display: 'flex',
          fontSize: 11,
          fontWeight: 600,
          gap: 5,
          height: 26,
          padding: '0 10px',
          userSelect: 'none',
        }}
      >
        {isFullscreen ? '✕ Exit' : '⛶ Full'}
      </button>
    </div>
  )
}

// ─── Admin bar — save / publish overlay on the preview ────────────────────────

const AdminBar: React.FC<{
  locale: string
  onSave: () => void
  onPublish: () => void
  isSaving: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}> = ({ locale, onSave, onPublish, isSaving, saveStatus }) => {
  return (
    <div
      aria-label="Preview admin bar"
      style={{
        alignItems: 'center',
        background: 'rgba(10,10,10,0.88)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        bottom: 0,
        display: 'flex',
        flexShrink: 0,
        gap: 8,
        left: 0,
        padding: '8px 12px',
        position: 'absolute',
        right: 0,
        zIndex: 50,
      }}
    >
      {/* Locale badge */}
      <span
        style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 4,
          color: 'rgba(255,255,255,0.6)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          padding: '3px 7px',
          textTransform: 'uppercase',
        }}
      >
        {locale}
      </span>

      {/* Status indicator */}
      {saveStatus === 'saving' && (
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Saving…</span>
      )}
      {saveStatus === 'saved' && (
        <span style={{ color: '#22c55e', fontSize: 11 }}>✓ Saved</span>
      )}
      {saveStatus === 'error' && (
        <span style={{ color: '#ef4444', fontSize: 11 }}>Save failed</span>
      )}

      <div style={{ flex: 1 }} />

      <AdminBarButton onClick={onSave} disabled={isSaving} variant="secondary">
        Save draft
      </AdminBarButton>
      <AdminBarButton onClick={onPublish} disabled={isSaving} variant="primary">
        Publish
      </AdminBarButton>
    </div>
  )
}

function AdminBarButton({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  variant: 'primary' | 'secondary'
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        alignItems: 'center',
        background: variant === 'primary' ? '#6366f1' : 'rgba(255,255,255,0.12)',
        border: 'none',
        borderRadius: 5,
        color: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        fontSize: 12,
        fontWeight: 600,
        height: 30,
        letterSpacing: '0.02em',
        opacity: disabled ? 0.5 : 1,
        padding: '0 14px',
        userSelect: 'none',
      }}
    >
      {children}
    </button>
  )
}

// ─── Focus a form field in the admin panel ────────────────────────────────────

function focusAdminField(fieldPath: string): void {
  // Direct selectors
  const directSelectors = [
    `[data-field-path="${fieldPath}"]`,
    `input[name="${fieldPath}"]`,
    `textarea[name="${fieldPath}"]`,
    `[id^="field-${fieldPath}"]`,
  ]

  for (const selector of directSelectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) {
      scrollAndHighlight(el)
      return
    }
  }

  // For block-level paths like "blocks.0" — find the block row in Payload's
  // blocks array UI and expand/highlight it.
  const blockRowMatch = fieldPath.match(/^blocks\.(\d+)$/)
  if (blockRowMatch) {
    const index = parseInt(blockRowMatch[1] ?? '0', 10)

    // Try Payload's block row selectors
    const rowSelectors = [
      `[data-field-path="blocks"] [data-row-index="${index}"]`,
      `[data-field-path="blocks.${index}"]`,
      `[data-array-row-index="${index}"]`,
    ]
    for (const selector of rowSelectors) {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) {
        // Expand collapsed block row if needed
        const toggle = el.querySelector<HTMLElement>('[data-collapsed]') ??
          el.querySelector<HTMLButtonElement>('button[aria-expanded="false"]')
        toggle?.click()
        scrollAndHighlight(el)
        return
      }
    }

    // Fallback: try to find the nth block row by counting collapsed rows
    const allRows = document.querySelectorAll<HTMLElement>('[data-field-path^="blocks."]')
    const row = Array.from(allRows).find((el) => {
      return el.getAttribute('data-field-path') === `blocks.${index}`
    })
    if (row) {
      scrollAndHighlight(row)
      return
    }

    // Last resort: scroll to the blocks field itself
    const blocksField = document.querySelector<HTMLElement>('[data-field-path="blocks"]')
    if (blocksField) scrollAndHighlight(blocksField)
    return
  }

  // For nested field paths like "blocks.0.tagline" — try the field then fall
  // back to the last path segment.
  const segments = fieldPath.split('.')
  if (segments.length > 1) {
    // Try each increasingly shorter suffix
    for (let i = 0; i < segments.length; i++) {
      const suffix = segments.slice(i).join('.')
      const candidates = [
        `[data-field-path="${suffix}"]`,
        `input[name="${suffix}"]`,
        `textarea[name="${suffix}"]`,
      ]
      for (const selector of candidates) {
        const el = document.querySelector<HTMLElement>(selector)
        if (el) {
          scrollAndHighlight(el)
          return
        }
      }
    }
  }
}

function scrollAndHighlight(el: HTMLElement): void {
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.focus({ preventScroll: true })
  el.classList.add('lp-field-highlight')
  setTimeout(() => el.classList.remove('lp-field-highlight'), 1400)
}

// ─── Inject highlight CSS once ────────────────────────────────────────────────

let highlightStyleInjected = false
function ensureHighlightStyle() {
  if (highlightStyleInjected || typeof document === 'undefined') return
  highlightStyleInjected = true
  const style = document.createElement('style')
  style.textContent = `
    .lp-field-highlight {
      outline: 2px solid var(--theme-success-500, #22c55e) !important;
      outline-offset: 2px;
      transition: outline 0.2s;
    }
  `
  document.head.appendChild(style)
}

// ─── Main component ────────────────────────────────────────────────────────────

export const CustomLivePreview: React.FC = () => {
  const {
    appIsReady,
    breakpoint,
    iframeRef,
    isLivePreviewing,
    loadedURL,
    popupRef,
    previewWindowType,
    setLoadedURL,
    shouldRenderIframe,
    size,
    url: urlRaw,
  } = useLivePreviewContext()

  const url = urlRaw ?? ''

  const locale = useLocale()
  const { mostRecentUpdate } = useDocumentEvents()
  const [formState, dispatchFields] = useAllFormFields()
  const { id, collectionSlug, globalSlug } = useDocumentInfo()

  // Keep a stable ref so the message-handler closure always gets the latest dispatch
  const dispatchFieldsRef = useRef(dispatchFields)
  useEffect(() => {
    dispatchFieldsRef.current = dispatchFields
  })

  // Inject highlight style on mount
  useEffect(() => {
    ensureHighlightStyle()
  }, [])

  // ─── Fullscreen state ─────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false)
  const toggleFullscreen = useCallback(() => setIsFullscreen((v) => !v), [])

  // ─── Save status ──────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function triggerSave(publish = false) {
    setSaveStatus('saving')
    // Find Payload's native save/publish buttons and click them
    const btn = publish
      ? (document.querySelector<HTMLButtonElement>('[id="action-publish"]') ??
         document.querySelector<HTMLButtonElement>('[data-action="publish"]') ??
         document.querySelector<HTMLButtonElement>('[aria-label*="publish" i]'))
      : (document.querySelector<HTMLButtonElement>('[id="action-save"]') ??
         document.querySelector<HTMLButtonElement>('[data-action="save"]') ??
         document.querySelector<HTMLButtonElement>('[aria-label*="save draft" i]') ??
         document.querySelector<HTMLButtonElement>('[aria-label*="save" i]'))

    if (btn) {
      btn.click()
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      setSaveStatus('saved')
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2400)
    } else {
      setSaveStatus('error')
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2400)
    }
  }

  // ─── postMessage bridge (mirrors LivePreviewWindow exactly) ─────────────────
  useEffect(() => {
    if (!isLivePreviewing || !appIsReady || !formState || !url) return

    const values = reduceFieldsToValues(formState, true)
    if (!values.id) values.id = id

    const message = {
      collectionSlug,
      data: values,
      externallyUpdatedRelationship: mostRecentUpdate,
      globalSlug,
      locale: locale.code,
      type: 'payload-live-preview',
    }

    if (previewWindowType === 'popup' && popupRef?.current) {
      popupRef.current.postMessage(message, url)
    }
    if (previewWindowType === 'iframe' && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(message, url)
    }
  }, [
    formState,
    url,
    collectionSlug,
    globalSlug,
    id,
    previewWindowType,
    popupRef,
    appIsReady,
    iframeRef,
    mostRecentUpdate,
    locale,
    isLivePreviewing,
    loadedURL,
  ])

  // SSR refresh event
  useEffect(() => {
    if (!isLivePreviewing || !appIsReady || !url) return
    const message = { type: 'payload-document-event' }
    if (previewWindowType === 'popup' && popupRef?.current) {
      popupRef.current.postMessage(message, url)
    }
    if (previewWindowType === 'iframe' && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(message, url)
    }
  }, [mostRecentUpdate, iframeRef, popupRef, previewWindowType, url, isLivePreviewing, appIsReady])

  // ─── Listen for messages from the preview iframe ─────────────────────────────
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'object' || event.data === null) return

      // Field click-to-focus
      if (event.data.type === 'payload-field-focus') {
        const path = typeof event.data.path === 'string' ? event.data.path : null
        if (path) focusAdminField(path)
        return
      }

      // Block reorder request from BlockOverlay
      if (event.data.type === 'payload-block-reorder') {
        const { from, to } = event.data as { from: number; to: number }
        if (typeof from === 'number' && typeof to === 'number' && to >= 0) {
          handleBlockReorder(from, to)
        }
        return
      }

      // Inline editor field update
      if (event.data.type === 'payload-field-update') {
        const path = typeof event.data.path === 'string' ? event.data.path : null
        const value = typeof event.data.value === 'string' ? event.data.value : null
        if (path !== null && value !== null) updateFormField(path, value)
        return
      }

      // Save/publish triggered from an in-iframe admin bar (if any)
      if (event.data.type === 'payload-preview-action') {
        const action = event.data.action as string
        if (action === 'save') triggerSave(false)
        if (action === 'publish') triggerSave(true)
        return
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // ─── Field update from inline editor ─────────────────────────────────────────
  //
  // When the user saves an edit in the InlineEditor (iframe), it sends
  // `payload-field-update { path, value }`. We push it into Payload's form
  // via dispatchFields (UPDATE action). If that fails (e.g. Payload internals
  // changed the action type) we fall back to the React controlled-input hack:
  // find the DOM input, set its native value, and fire synthetic input/change
  // events so React picks up the mutation.
  function updateFormField(path: string, value: string) {
    // ── 1. Payload form dispatch ───────────────────────────────────────────
    try {
      dispatchFieldsRef.current({
        type: 'UPDATE',
        path,
        value,
      } as Parameters<typeof dispatchFieldsRef.current>[0])
      return
    } catch {
      // fall through
    }

    // ── 2. DOM / React controlled-input hack ──────────────────────────────
    // For nested block paths, expand the row first so the input is in the DOM.
    const blockMatch = path.match(/^blocks\.(\d+)/)
    if (blockMatch) {
      const idx = parseInt(blockMatch[1] ?? '0', 10)
      expandBlockRow(idx)
    }

    setTimeout(() => {
      const selectors = [
        `input[name="${path}"]`,
        `textarea[name="${path}"]`,
        `[data-field-path="${path}"] input`,
        `[data-field-path="${path}"] textarea`,
      ]
      for (const sel of selectors) {
        const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(sel)
        if (!el) continue
        const proto = el.tagName === 'TEXTAREA'
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
        if (nativeSetter) {
          nativeSetter.call(el, value)
          el.dispatchEvent(new Event('input', { bubbles: true }))
          el.dispatchEvent(new Event('change', { bubbles: true }))
        }
        return
      }
    }, 120) // brief delay lets the block row expand
  }

  function expandBlockRow(index: number) {
    const blocksField = document.querySelector<HTMLElement>('[data-field-path="blocks"]')
    if (!blocksField) return
    const rowSelectors = [
      `[data-field-path="blocks.${index}"]`,
      `[data-field-path="blocks"] [data-row-index="${index}"]`,
    ]
    for (const sel of rowSelectors) {
      const row = blocksField.querySelector<HTMLElement>(sel) ??
        document.querySelector<HTMLElement>(sel)
      if (!row) continue
      const collapsed = row.querySelector<HTMLButtonElement>('button[aria-expanded="false"]')
      collapsed?.click()
      return
    }
  }

  // ─── Block reorder ───────────────────────────────────────────────────────────
  //
  // Payload stores blocks as an array in the form state. We swap the `from` and
  // `to` positions by clicking Payload's native move-up / move-down row buttons
  // inside the blocks array field UI. This is safer than directly dispatching
  // into the form state since it respects Payload's internal row IDs.
  function handleBlockReorder(from: number, to: number) {
    const blocksField = document.querySelector<HTMLElement>('[data-field-path="blocks"]')
    if (!blocksField) return

    // Try to find the row at `from` and click the move button
    const direction = to < from ? 'up' : 'down'
    const steps = Math.abs(to - from)

    // Payload renders move buttons with specific aria labels per row
    const rows = blocksField.querySelectorAll<HTMLElement>('[data-row]')
    const targetRow = rows[from]
    if (!targetRow) return

    const btnLabel = direction === 'up' ? /move up/i : /move down/i
    const moveBtn = Array.from(
      targetRow.querySelectorAll<HTMLButtonElement>('button'),
    ).find((btn) => btnLabel.test(btn.getAttribute('aria-label') ?? btn.title ?? btn.textContent ?? ''))

    if (moveBtn) {
      for (let i = 0; i < steps; i++) {
        moveBtn.click()
      }
    }
  }

  // ─── Panel width + drag-to-resize ────────────────────────────────────────────
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_PX)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)

  const isResponsive = !breakpoint || breakpoint === 'responsive'
  const deviceW = size?.width ?? 0
  const deviceH = size?.height ?? 0

  // Auto-resize panel when breakpoint changes so the device fits at ~1:1
  useEffect(() => {
    if (isFullscreen) return
    const parent = panelRef.current?.parentElement
    const maxAvail = parent ? parent.clientWidth - MIN_FORM_PX - HANDLE_PX : 1200

    const ideal = deviceW > 0
      ? Math.min(deviceW + INSET_PX * 2, maxAvail)
      : DEFAULT_PANEL_PX

    setPanelWidth(Math.max(MIN_PANEL_PX, ideal))
  }, [deviceW, isFullscreen])

  // Drag handle mouse events
  const onHandleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isFullscreen) return
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartWidth.current = panelWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    e.preventDefault()
  }, [panelWidth, isFullscreen])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !panelRef.current) return
      const parent = panelRef.current.parentElement
      const maxW = parent ? parent.clientWidth - MIN_FORM_PX - HANDLE_PX : 1200
      const delta = dragStartX.current - e.clientX
      const newWidth = Math.max(MIN_PANEL_PX, Math.min(dragStartWidth.current + delta, maxW))
      setPanelWidth(newWidth)
    }
    const onMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // ─── Device scaling ─────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null)
  const [iframeStyle, setIframeStyle] = useState<React.CSSProperties>({
    height: '100%',
    width: '100%',
  })

  const computeScale = useCallback(() => {
    if (!containerRef.current) return

    if (isResponsive || !deviceW || !deviceH) {
      setIframeStyle({ height: '100%', width: '100%' })
      return
    }

    const availW = containerRef.current.clientWidth - INSET_PX * 2
    const availH = containerRef.current.clientHeight - INSET_PX * 2
    if (availW <= 0 || availH <= 0) return

    const fit = Math.min(1, availW / deviceW, availH / deviceH)
    const scaledW = deviceW * fit
    const offsetX = Math.max(0, (availW - scaledW) / 2)

    setIframeStyle({
      height: deviceH,
      left: INSET_PX + offsetX,
      position: 'absolute',
      top: INSET_PX,
      transform: `scale(${fit})`,
      transformOrigin: 'top left',
      width: deviceW,
    })
  }, [isResponsive, deviceW, deviceH])

  useEffect(() => {
    computeScale()
    const ro = new ResizeObserver(computeScale)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [computeScale])

  // ─── Escape key exits fullscreen ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isFullscreen])

  if (previewWindowType !== 'iframe') return null

  // ─── Fullscreen mode: fixed overlay covering entire viewport ─────────────────
  const fullscreenStyles: React.CSSProperties = isFullscreen
    ? {
        background: 'var(--theme-bg)',
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        left: 0,
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 9999,
      }
    : {}

  return (
    <div
      ref={panelRef}
      style={{
        background: 'var(--theme-bg)',
        display: isLivePreviewing ? 'flex' : 'none',
        flexDirection: 'column',
        flexGrow: 0,
        flexShrink: 0,
        height: isFullscreen ? undefined : 'calc(100vh - var(--doc-controls-height))',
        overflow: 'hidden',
        position: isFullscreen ? undefined : 'sticky',
        top: isFullscreen ? undefined : 'var(--doc-controls-height)',
        width: isFullscreen ? undefined : panelWidth,
        ...fullscreenStyles,
      }}
    >
      {/* Drag handle on the left edge — hidden in fullscreen */}
      {!isFullscreen && (
        <div
          onMouseDown={onHandleMouseDown}
          style={{
            background: 'var(--theme-elevation-100)',
            bottom: 0,
            cursor: 'col-resize',
            left: 0,
            position: 'absolute',
            top: 0,
            transition: 'background 0.15s',
            width: HANDLE_PX,
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLDivElement).style.background = 'var(--theme-elevation-300)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLDivElement).style.background = 'var(--theme-elevation-100)'
          }}
        />
      )}

      {/* Content (offset by handle width in normal mode) */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          overflow: 'hidden',
          paddingLeft: isFullscreen ? 0 : HANDLE_PX,
        }}
      >
        <BreakpointBar onFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />

        <div
          ref={containerRef}
          style={{
            background: 'var(--theme-elevation-50)',
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {shouldRenderIframe && (
            <iframe
              id="live-preview-iframe"
              onLoad={() => setLoadedURL(url)}
              ref={iframeRef}
              src={url}
              style={{
                border: 'none',
                boxShadow: isResponsive
                  ? 'none'
                  : '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
                ...iframeStyle,
              }}
              title="Live Preview"
            />
          )}

          {/* Admin bar floats over the iframe at the bottom */}
          <AdminBar
            locale={locale.code}
            onSave={() => triggerSave(false)}
            onPublish={() => triggerSave(true)}
            isSaving={saveStatus === 'saving'}
            saveStatus={saveStatus}
          />
        </div>
      </div>
    </div>
  )
}
