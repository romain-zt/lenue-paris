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

import { BreakpointBar } from './live-preview/BreakpointBar'
import { FAB } from './live-preview/FAB'
import { ensureHighlightStyle, focusAdminField } from './live-preview/utils'

const INSET_PX = 16
const HANDLE_PX = 6
const MIN_PANEL_PX = 300
const MIN_FORM_PX = 280
const DEFAULT_PANEL_PX = 500

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

  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit })

  const dispatchFieldsRef = useRef(dispatchFields)
  useEffect(() => { dispatchFieldsRef.current = dispatchFields })

  // Keep a stable ref to triggerSave so the message handler (with [] deps) always
  // calls the latest version — avoids stale closure over locale / collectionSlug etc.
  const triggerSaveRef = useRef<(publish?: boolean) => void>(() => {})

  useEffect(() => { ensureHighlightStyle() }, [])

  // ─── Fullscreen state — URL-driven (?fs=1) ────────────────────────────────

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedField, setSelectedField] = useState<string | null>(null)

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
      window.history.pushState(
        {},
        '',
        `${window.location.pathname}${search ? '?' + search : ''}${window.location.hash}`,
      )
      return next
    })
  }, [])

  useEffect(() => {
    const win = iframeRef.current?.contentWindow
    if (!win || !url) return
    win.postMessage(
      { type: 'payload-preview-fullscreen', isFullscreen },
      url.startsWith('http') ? new URL(url).origin : '*',
    )
  }, [isFullscreen, iframeRef, url])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) toggleFullscreen()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isFullscreen, toggleFullscreen])

  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search)
      setIsFullscreen(params.get('fs') === '1')
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  // ─── Save / publish ────────────────────────────────────────────────────────

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

  // Keep triggerSaveRef in sync so the message handler always uses the latest version
  useEffect(() => { triggerSaveRef.current = triggerSave })

  // ─── Reload iframe when AI patches the DB (no full page reload needed) ──────

  useEffect(() => {
    const handle = () => {
      if (!iframeRef.current) return
      // Force reload by toggling src — works cross-origin unlike contentWindow.reload()
      const src = iframeRef.current.src
      iframeRef.current.src = ''
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = src
      }, 80)
    }
    window.addEventListener('lp:ai-patch-done', handle)
    return () => window.removeEventListener('lp:ai-patch-done', handle)
  }, [iframeRef])

  // ─── postMessage: push form data to iframe ────────────────────────────────

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
    formState, url, collectionSlug, globalSlug, id,
    previewWindowType, popupRef, appIsReady, iframeRef,
    mostRecentUpdate, locale, isLivePreviewing, loadedURL,
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

  // ─── postMessage: receive field focus / block reorder / inline edit ───────

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'object' || event.data === null) return

      if (event.data.type === 'payload-field-focus') {
        const path = typeof event.data.path === 'string' ? event.data.path : null
        if (path) {
          focusAdminField(path)
          setSelectedField(path)
        }
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
        if (action === 'save') triggerSaveRef.current(false)
        if (action === 'publish') triggerSaveRef.current(true)
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
      // fall through to DOM approach
    }

    const blockMatch = path.match(/^blocks\.(\d+)/)
    if (blockMatch) expandBlockRow(parseInt(blockMatch[1] ?? '0', 10))

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
    for (const sel of [
      `[data-field-path="blocks.${index}"]`,
      `[data-field-path="blocks"] [data-row-index="${index}"]`,
    ]) {
      const row =
        blocksField.querySelector<HTMLElement>(sel) ?? document.querySelector<HTMLElement>(sel)
      if (!row) continue
      row.querySelector<HTMLButtonElement>('button[aria-expanded="false"]')?.click()
      return
    }
  }

  function handleBlockReorder(from: number, to: number) {
    const blocksField = document.querySelector<HTMLElement>('[data-field-path="blocks"]')
    if (!blocksField) return

    const direction = to < from ? 'up' : 'down'
    const steps = Math.abs(to - from)
    const targetRow = blocksField.querySelectorAll<HTMLElement>('[data-row]')[from]
    if (!targetRow) return

    const btnLabel = direction === 'up' ? /move up/i : /move down/i
    const moveBtn = Array.from(targetRow.querySelectorAll<HTMLButtonElement>('button')).find(
      (btn) => btnLabel.test(btn.getAttribute('aria-label') ?? btn.title ?? btn.textContent ?? ''),
    )
    if (moveBtn) {
      for (let i = 0; i < steps; i++) moveBtn.click()
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
      setPanelWidth(Math.max(MIN_PANEL_PX, Math.min(dragStartWidth.current + delta, maxW)))
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

  const iframeShadow = isResponsive
    ? 'none'
    : '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)'

  // ─── Fullscreen mode: fixed overlay, iframe + FAB only ───────────────────

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
                setTimeout(() => {
                  iframeRef.current?.contentWindow?.postMessage(
                    { type: 'payload-preview-fullscreen', isFullscreen: true },
                    '*',
                  )
                }, 200)
              }}
              ref={iframeRef}
              src={url}
              style={{ border: 'none', boxShadow: iframeShadow, ...iframeStyle }}
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
            selectedField={selectedField}
            onAI={(fieldPath) => {
              window.dispatchEvent(
                new CustomEvent('aipanel:open', {
                  detail: {
                    fieldPath,
                    prompt: fieldPath
                      ? `Modifier le bloc : ${fieldPath}`
                      : undefined,
                  },
                }),
              )
              setSelectedField(null)
            }}
          />
        </div>
      </div>
    )
  }

  // ─── Normal mode: resizable split panel ───────────────────────────────────

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
          (e.currentTarget as HTMLDivElement).style.background = 'var(--theme-elevation-300)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'var(--theme-elevation-100)'
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

        {/* AI action bar — appears when a block is selected via the preview iframe */}
        {selectedField && (
          <div
            style={{
              alignItems: 'center',
              background: 'rgba(99,102,241,0.07)',
              borderBottom: '1px solid rgba(99,102,241,0.18)',
              display: 'flex',
              flexShrink: 0,
              gap: 6,
              padding: '4px 8px',
            }}
          >
            <code
              style={{
                color: 'rgba(99,102,241,0.8)',
                flex: 1,
                fontFamily: 'monospace',
                fontSize: 10,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedField}
            </code>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('aipanel:open', {
                    detail: {
                      fieldPath: selectedField,
                      prompt: `Modifier le bloc : ${selectedField}`,
                    },
                  }),
                )
              }}
              style={{
                alignItems: 'center',
                background: 'rgba(99,102,241,0.88)',
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                flexShrink: 0,
                fontFamily: 'system-ui, sans-serif',
                fontSize: 11,
                fontWeight: 600,
                gap: 3,
                minHeight: 26,
                padding: '0 8px',
              }}
            >
              ✦ Modifier avec l&apos;IA
            </button>
            <button
              type="button"
              onClick={() => setSelectedField(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(99,102,241,0.5)',
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1,
                padding: 2,
              }}
            >
              ×
            </button>
          </div>
        )}

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
              style={{ border: 'none', boxShadow: iframeShadow, ...iframeStyle }}
              title="Live Preview"
            />
          )}
        </div>
      </div>
    </div>
  )
}
