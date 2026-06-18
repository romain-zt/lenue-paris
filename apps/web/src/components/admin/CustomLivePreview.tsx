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

const BreakpointBar: React.FC = () => {
  const { breakpoint, breakpoints, setBreakpoint } = useLivePreviewContext()

  useEffect(() => {
    setBreakpoint('mobile')
  }, [])

  const allBreakpoints = [
    { label: 'Responsive', name: 'responsive' },
    ...(breakpoints ?? []).filter((bp) => bp.name !== 'responsive'),
  ]

  return (
    <div
      style={{
        alignItems: 'center',
        background: 'var(--theme-bg)',
        borderBottom: '1px solid var(--theme-elevation-100)',
        display: 'flex',
        flexShrink: 0,
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
          fontSize: 11,
          marginLeft: 12,
        }}
      >
        Click any field in the preview to focus it in the form
      </span>
    </div>
  )
}

// ─── Focus a form field in the admin panel ────────────────────────────────────

function focusAdminField(fieldPath: string): void {
  // Try direct input/textarea match first
  const selectors = [
    `input[name="${fieldPath}"]`,
    `textarea[name="${fieldPath}"]`,
    `[data-field-path="${fieldPath}"]`,
    `[id^="field-${fieldPath}"]`,
  ]

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus({ preventScroll: true })
      el.classList.add('lp-field-highlight')
      setTimeout(() => el.classList.remove('lp-field-highlight'), 1400)
      return
    }
  }

  // Fallback: try to find by dot-notation (e.g. "blocks.0.tagline" → "tagline")
  const lastSegment = fieldPath.split('.').pop() ?? fieldPath
  const fallback = document.querySelector<HTMLElement>(
    `input[name="${lastSegment}"], textarea[name="${lastSegment}"]`,
  )
  if (fallback) {
    fallback.scrollIntoView({ behavior: 'smooth', block: 'center' })
    fallback.focus({ preventScroll: true })
    fallback.classList.add('lp-field-highlight')
    setTimeout(() => fallback.classList.remove('lp-field-highlight'), 1400)
  }
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
  const [formState] = useAllFormFields()
  const { id, collectionSlug, globalSlug } = useDocumentInfo()

  // Inject highlight style on mount
  useEffect(() => {
    ensureHighlightStyle()
  }, [])

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

  // ─── P1: listen for field-focus messages from the preview iframe ─────────────
  useEffect(() => {
    if (!iframeRef?.current) return

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'object' || event.data === null) return
      if (event.data.type !== 'payload-field-focus') return
      const path = typeof event.data.path === 'string' ? event.data.path : null
      if (!path) return
      focusAdminField(path)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [iframeRef])

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
    const parent = panelRef.current?.parentElement
    const maxAvail = parent ? parent.clientWidth - MIN_FORM_PX - HANDLE_PX : 1200

    const ideal = deviceW > 0
      ? Math.min(deviceW + INSET_PX * 2, maxAvail)
      : DEFAULT_PANEL_PX

    setPanelWidth(Math.max(MIN_PANEL_PX, ideal))
  }, [deviceW])

  // Drag handle mouse events
  const onHandleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartWidth.current = panelWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    e.preventDefault()
  }, [panelWidth])

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

  if (previewWindowType !== 'iframe') return null

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
      {/* Drag handle on the left edge */}
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

      {/* Content offset by handle width */}
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', paddingLeft: HANDLE_PX }}>
        <BreakpointBar />

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
