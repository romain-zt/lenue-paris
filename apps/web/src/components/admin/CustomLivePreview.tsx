'use client'

import { useAllFormFields } from '@payloadcms/ui'
import { useConfig } from '@payloadcms/ui'
import { useDocumentEvents } from '@payloadcms/ui'
import { useDocumentInfo } from '@payloadcms/ui'
import { useForm } from '@payloadcms/ui'
import { useLivePreviewContext } from '@payloadcms/ui'
import { useLocale } from '@payloadcms/ui'
import { formatAdminURL, reduceFieldsToValues } from 'payload/shared'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const INSET_PX = 16
const HANDLE_PX = 6
const MIN_PANEL_PX = 300
const MIN_FORM_PX = 280
const DEFAULT_PANEL_PX = 500

// ─── Breakpoint selector (normal mode only) ───────────────────────────────────

const BreakpointBar: React.FC<{
  onFullscreen: () => void
}> = ({ onFullscreen }) => {
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
        title="Open fullscreen preview"
        onClick={onFullscreen}
        style={{
          alignItems: 'center',
          background: 'var(--theme-elevation-150)',
          border: 'none',
          borderRadius: 4,
          color: 'var(--theme-text)',
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
        ⛶ Full
      </button>
    </div>
  )
}

// ─── Floating Action Button (fullscreen only) ─────────────────────────────────

const FAB: React.FC<{
  locale: string
  onSave: () => void
  onPublish: () => void
  onExit: () => void
  isSaving: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}> = ({ locale, onSave, onPublish, onExit, isSaving, saveStatus }) => {
  const [open, setOpen] = useState(false)

  const statusColor =
    saveStatus === 'saved' ? '#22c55e' : saveStatus === 'error' ? '#ef4444' : 'rgba(255,255,255,0.5)'
  const statusLabel =
    saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Save failed' : null

  return (
    <div
      style={{
        bottom: 20,
        position: 'absolute',
        right: 20,
        zIndex: 50,
      }}
    >
      {/* Popup menu */}
      {open && (
        <div
          style={{
            background: 'rgba(12,12,12,0.94)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            bottom: 60,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minWidth: 168,
            padding: 8,
            position: 'absolute',
            right: 0,
          }}
        >
          {/* Locale + status row */}
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: 6,
              padding: '4px 6px',
            }}
          >
            <span
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 4,
                color: 'rgba(255,255,255,0.5)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.07em',
                padding: '2px 6px',
                textTransform: 'uppercase',
              }}
            >
              {locale}
            </span>
            {statusLabel && (
              <span style={{ color: statusColor, fontSize: 11 }}>{statusLabel}</span>
            )}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', height: 1, margin: '2px 0' }} />

          <FABMenuItem onClick={() => { onSave(); setOpen(false) }} disabled={isSaving}>
            Save draft
          </FABMenuItem>
          <FABMenuItem onClick={() => { onPublish(); setOpen(false) }} disabled={isSaving} primary>
            Publish
          </FABMenuItem>

          <div style={{ background: 'rgba(255,255,255,0.06)', height: 1, margin: '2px 0' }} />

          <FABMenuItem onClick={onExit}>
            ✕ Exit fullscreen
          </FABMenuItem>
        </div>
      )}

      {/* Circular button */}
      <button
        type="button"
        title={open ? 'Close menu' : 'Preview menu'}
        onClick={() => setOpen((v) => !v)}
        style={{
          alignItems: 'center',
          background: open ? 'rgba(255,255,255,0.15)' : 'rgba(12,12,12,0.88)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '50%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          fontSize: 18,
          height: 48,
          justifyContent: 'center',
          transition: 'background 0.15s',
          userSelect: 'none',
          width: 48,
        }}
      >
        {open ? '✕' : '⚙'}
      </button>
    </div>
  )
}

function FABMenuItem({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: primary ? '#6366f1' : 'transparent',
        border: 'none',
        borderRadius: 7,
        color: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
        fontWeight: primary ? 600 : 400,
        opacity: disabled ? 0.5 : 1,
        padding: '8px 10px',
        textAlign: 'left',
        transition: 'background 0.12s',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        if (!primary && !disabled)
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'
      }}
      onMouseLeave={(e) => {
        if (!primary)
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}

// ─── Focus a form field in the admin panel ────────────────────────────────────

function focusAdminField(fieldPath: string): void {
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

  const blockRowMatch = fieldPath.match(/^blocks\.(\d+)$/)
  if (blockRowMatch) {
    const index = parseInt(blockRowMatch[1] ?? '0', 10)
    const rowSelectors = [
      `[data-field-path="blocks"] [data-row-index="${index}"]`,
      `[data-field-path="blocks.${index}"]`,
      `[data-array-row-index="${index}"]`,
    ]
    for (const selector of rowSelectors) {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) {
        const toggle =
          el.querySelector<HTMLElement>('[data-collapsed]') ??
          el.querySelector<HTMLButtonElement>('button[aria-expanded="false"]')
        toggle?.click()
        scrollAndHighlight(el)
        return
      }
    }
    const allRows = document.querySelectorAll<HTMLElement>('[data-field-path^="blocks."]')
    const row = Array.from(allRows).find(
      (el) => el.getAttribute('data-field-path') === `blocks.${index}`,
    )
    if (row) {
      scrollAndHighlight(row)
      return
    }
    const blocksField = document.querySelector<HTMLElement>('[data-field-path="blocks"]')
    if (blocksField) scrollAndHighlight(blocksField)
    return
  }

  const segments = fieldPath.split('.')
  if (segments.length > 1) {
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
  const { submit } = useForm()
  const { config: { routes: { api } } } = useConfig()

  // Keep a ref to the latest submit so the message-listener closure never goes stale
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit })

  const dispatchFieldsRef = useRef(dispatchFields)
  useEffect(() => {
    dispatchFieldsRef.current = dispatchFields
  })

  useEffect(() => {
    ensureHighlightStyle()
  }, [])

  // ─── Fullscreen state — URL-driven (?fs=1) ────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Read URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('fs') === '1') setIsFullscreen(true)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((current) => {
      const next = !current
      const params = new URLSearchParams(window.location.search)
      if (next) {
        params.set('fs', '1')
      } else {
        params.delete('fs')
      }
      const search = params.toString()
      const newUrl = `${window.location.pathname}${search ? '?' + search : ''}${window.location.hash}`
      window.history.pushState({}, '', newUrl)
      return next
    })
  }, [])

  // Notify iframe of fullscreen state so it can switch click behaviour
  useEffect(() => {
    const win = iframeRef.current?.contentWindow
    if (!win || !url) return
    win.postMessage({ type: 'payload-preview-fullscreen', isFullscreen }, url.startsWith('http') ? new URL(url).origin : '*')
  }, [isFullscreen, iframeRef, url])

  // Escape key exits fullscreen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) toggleFullscreen()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isFullscreen, toggleFullscreen])

  // Popstate (browser back/forward)
  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search)
      setIsFullscreen(params.get('fs') === '1')
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  // ─── Save status ──────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function triggerSave(publish = false) {
    setSaveStatus('saving')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    const localeCode = locale.code
    const draftParams = `?locale=${localeCode}&depth=0&fallback-locale=null&draft=true`
    const publishParams = `?locale=${localeCode}&depth=0`

    let action: string
    let method = 'POST'

    if (collectionSlug) {
      action = formatAdminURL({
        apiRoute: api,
        path: `/${collectionSlug}${id ? `/${id}` : ''}${publish ? publishParams : draftParams}`,
      })
      if (id) method = 'PATCH'
    } else if (globalSlug) {
      action = formatAdminURL({
        apiRoute: api,
        path: `/globals/${globalSlug}${publish ? publishParams : draftParams}`,
      })
    } else {
      setSaveStatus('error')
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2400)
      return
    }

    submitRef.current({
      action,
      method,
      overrides: { _status: publish ? 'published' : 'draft' },
      skipValidation: !publish,
    })
      .then(() => {
        setSaveStatus('saved')
        saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2400)
      })
      .catch(() => {
        setSaveStatus('error')
        saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2400)
      })
  }

  // ─── postMessage bridge ───────────────────────────────────────────────────
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

  const prevUpdateRef = useRef(mostRecentUpdate)
  useEffect(() => {
    if (!isLivePreviewing || !appIsReady || !url) return
    if (mostRecentUpdate === prevUpdateRef.current) return
    prevUpdateRef.current = mostRecentUpdate

    const message = { type: 'payload-document-event' }
    if (previewWindowType === 'popup' && popupRef?.current) {
      popupRef.current.postMessage(message, url)
    }
    if (previewWindowType === 'iframe' && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(message, url)
    }
  }, [mostRecentUpdate, iframeRef, popupRef, previewWindowType, url, isLivePreviewing, appIsReady])

  // ─── Listen for messages from the preview iframe ──────────────────────────
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'object' || event.data === null) return

      if (event.data.type === 'payload-field-focus') {
        const path = typeof event.data.path === 'string' ? event.data.path : null
        if (path) focusAdminField(path)
        return
      }

      if (event.data.type === 'payload-block-reorder') {
        const { from, to } = event.data as { from: number; to: number }
        if (typeof from === 'number' && typeof to === 'number' && to >= 0) {
          handleBlockReorder(from, to)
        }
        return
      }

      if (event.data.type === 'payload-field-update') {
        const path = typeof event.data.path === 'string' ? event.data.path : null
        const value = typeof event.data.value === 'string' ? event.data.value : null
        if (path !== null && value !== null) updateFormField(path, value)
        return
      }

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

  // ─── Field update from inline editor ─────────────────────────────────────
  function updateFormField(path: string, value: string) {
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
        const proto =
          el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
        if (nativeSetter) {
          nativeSetter.call(el, value)
          el.dispatchEvent(new Event('input', { bubbles: true }))
          el.dispatchEvent(new Event('change', { bubbles: true }))
        }
        return
      }
    }, 120)
  }

  function expandBlockRow(index: number) {
    const blocksField = document.querySelector<HTMLElement>('[data-field-path="blocks"]')
    if (!blocksField) return
    const rowSelectors = [
      `[data-field-path="blocks.${index}"]`,
      `[data-field-path="blocks"] [data-row-index="${index}"]`,
    ]
    for (const sel of rowSelectors) {
      const row =
        blocksField.querySelector<HTMLElement>(sel) ?? document.querySelector<HTMLElement>(sel)
      if (!row) continue
      const collapsed = row.querySelector<HTMLButtonElement>('button[aria-expanded="false"]')
      collapsed?.click()
      return
    }
  }

  // ─── Block reorder ────────────────────────────────────────────────────────
  function handleBlockReorder(from: number, to: number) {
    const blocksField = document.querySelector<HTMLElement>('[data-field-path="blocks"]')
    if (!blocksField) return

    const direction = to < from ? 'up' : 'down'
    const steps = Math.abs(to - from)

    const rows = blocksField.querySelectorAll<HTMLElement>('[data-row]')
    const targetRow = rows[from]
    if (!targetRow) return

    const btnLabel = direction === 'up' ? /move up/i : /move down/i
    const moveBtn = Array.from(targetRow.querySelectorAll<HTMLButtonElement>('button')).find((btn) =>
      btnLabel.test(
        btn.getAttribute('aria-label') ?? btn.title ?? btn.textContent ?? '',
      ),
    )

    if (moveBtn) {
      for (let i = 0; i < steps; i++) {
        moveBtn.click()
      }
    }
  }

  // ─── Panel width + drag-to-resize ────────────────────────────────────────
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_PX)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)

  const isResponsive = !breakpoint || breakpoint === 'responsive'
  const deviceW = size?.width ?? 0
  const deviceH = size?.height ?? 0

  useEffect(() => {
    if (isFullscreen) return
    const parent = panelRef.current?.parentElement
    const maxAvail = parent ? parent.clientWidth - MIN_FORM_PX - HANDLE_PX : 1200
    const ideal =
      deviceW > 0 ? Math.min(deviceW + INSET_PX * 2, maxAvail) : DEFAULT_PANEL_PX
    setPanelWidth(Math.max(MIN_PANEL_PX, ideal))
  }, [deviceW, isFullscreen])

  const onHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isFullscreen) return
      isDragging.current = true
      dragStartX.current = e.clientX
      dragStartWidth.current = panelWidth
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      e.preventDefault()
    },
    [panelWidth, isFullscreen],
  )

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

  // ─── Device scaling ───────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null)
  const [iframeStyle, setIframeStyle] = useState<React.CSSProperties>({
    height: '100%',
    width: '100%',
  })

  const computeScale = useCallback(() => {
    if (!containerRef.current) return

    if (isFullscreen || isResponsive || !deviceW || !deviceH) {
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
  }, [isFullscreen, isResponsive, deviceW, deviceH])

  useEffect(() => {
    computeScale()
    const ro = new ResizeObserver(computeScale)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [computeScale])

  if (previewWindowType !== 'iframe') return null

  // ─── Fullscreen: fixed overlay, only iframe + FAB ─────────────────────────
  if (isFullscreen) {
    return (
      <div
        style={{
          background: '#000',
          bottom: 0,
          display: isLivePreviewing ? 'flex' : 'none',
          flexDirection: 'column',
          left: 0,
          position: 'fixed',
          right: 0,
          top: 0,
          zIndex: 9999,
        }}
      >
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
              onLoad={() => {
                setLoadedURL(url)
                // Re-send fullscreen state after iframe reload
                setTimeout(() => {
                  iframeRef.current?.contentWindow?.postMessage(
                    { type: 'payload-preview-fullscreen', isFullscreen: true },
                    '*',
                  )
                }, 200)
              }}
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

          <FAB
            locale={locale.code}
            onSave={() => triggerSave(false)}
            onPublish={() => triggerSave(true)}
            onExit={toggleFullscreen}
            isSaving={saveStatus === 'saving'}
            saveStatus={saveStatus}
          />
        </div>
      </div>
    )
  }

  // ─── Normal mode: split form + preview panel ──────────────────────────────
  return (
    <div
      ref={panelRef}
      style={{
        background: 'var(--theme-bg)',
        display: isLivePreviewing ? 'flex' : 'none',
        flexDirection: 'column',
        flexGrow: 0,
        flexShrink: 0,
        height: 'calc(100vh - var(--doc-controls-height))',
        overflow: 'hidden',
        position: 'sticky',
        top: 'var(--doc-controls-height)',
        width: panelWidth,
      }}
    >
      {/* Drag handle */}
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

      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          overflow: 'hidden',
          paddingLeft: HANDLE_PX,
        }}
      >
        <BreakpointBar onFullscreen={toggleFullscreen} />

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
        </div>
      </div>
    </div>
  )
}
