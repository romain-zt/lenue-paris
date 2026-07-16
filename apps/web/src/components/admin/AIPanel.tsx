'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale } from '@payloadcms/ui'
import { ensureHighlightStyle, focusAdminField, scrollAndHighlight } from './live-preview/utils'
import { AiPanelTabSession } from './AiPanelTabSession'
import {
  createDefaultTab,
  loadOrInitTabsState,
  nextDefaultTabTitle,
  removeTabData,
  saveTabsState,
  type AiPanelTab,
  type AiPanelTabsState,
} from '@/lib/aiPanelTabs'

import {
  isContentLocale,
  parseContentLocale,
  type ContentLocale,
} from '@repo/payload-schema/i18n/content-locales'

type DocContext = {
  type: 'collection' | 'collection-list' | 'global' | 'dashboard'
  collection?: string
  id?: string
  slug?: string
  locale?: ContentLocale
}

function parseAdminPath(pathname: string): DocContext {
  const parts = pathname.split('/').filter(Boolean)
  const adminIdx = parts.indexOf('admin')
  if (adminIdx === -1) return { type: 'dashboard' }
  const after = parts.slice(adminIdx + 1)
  if (after[0] === 'collections' && after[1] && after[2] && after[2] !== 'create') {
    return { type: 'collection', collection: after[1], id: after[2] }
  }
  if (after[0] === 'collections' && after[1] && !after[2]) {
    return { type: 'collection-list', collection: after[1] }
  }
  if (after[0] === 'globals' && after[1]) {
    return { type: 'global', slug: after[1] }
  }
  return { type: 'dashboard' }
}

export const AIPanel: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [docContext, setDocContext] = useState<DocContext>({ type: 'dashboard' })
  const [mounted, setMounted] = useState(false)
  const [tabsState, setTabsState] = useState<AiPanelTabsState | null>(null)
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)
  const docContextRef = useRef(docContext)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    setTabsState(loadOrInitTabsState())
  }, [mounted])

  useEffect(() => { ensureHighlightStyle() }, [])

  useEffect(() => {
    docContextRef.current = docContext
  }, [docContext])

  useEffect(() => {
    const adminLocale = isContentLocale(locale.code)
      ? (locale.code as ContentLocale)
      : parseContentLocale()
    setDocContext({
      ...parseAdminPath(pathname),
      locale: adminLocale,
    })
  }, [pathname, locale.code])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const field = new URLSearchParams(window.location.search).get('field')
    if (!field) return
    const timer = setTimeout(() => {
      focusAdminField(field)
      const el = document.querySelector<HTMLElement>(
        `[data-field-path="${field}"], input[name="${field}"], textarea[name="${field}"]`,
      )
      if (el) scrollAndHighlight(el)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const handleIframeMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return
      if (e.data.type === 'lp:ai-field-help') {
        const { path, label, value } = e.data as { path: string; label?: string; value?: string }
        const fieldName = label ?? path
        const prompt = value
          ? `Aide-moi avec le champ "${fieldName}" (${path}).\n\nValeur actuelle :\n"${value}"`
          : `Explique-moi le champ "${fieldName}" (${path}) et aide-moi à le remplir.`
        setOpen(true)
        setPendingPrompt(prompt)
      }
    }
    window.addEventListener('message', handleIframeMessage)
    return () => window.removeEventListener('message', handleIframeMessage)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ fieldPath?: string; prompt?: string }>).detail ?? {}
      setOpen(true)
      if (detail.prompt) {
        setPendingPrompt(detail.prompt)
      } else if (detail.fieldPath) {
        setPendingPrompt(`Modifier le bloc : ${detail.fieldPath}`)
      }
    }
    window.addEventListener('aipanel:open', handler)
    return () => window.removeEventListener('aipanel:open', handler)
  }, [])

  const updateTabsState = useCallback((updater: (prev: AiPanelTabsState) => AiPanelTabsState) => {
    setTabsState(prev => {
      if (!prev) return prev
      const next = updater(prev)
      saveTabsState(next)
      return next
    })
  }, [])

  const addTab = useCallback(() => {
    updateTabsState(prev => {
      const tab = createDefaultTab(nextDefaultTabTitle(prev.tabs))
      return { tabs: [...prev.tabs, tab], activeTabId: tab.id }
    })
  }, [updateTabsState])

  const closeTab = useCallback((tabId: string) => {
    updateTabsState(prev => {
      if (prev.tabs.length <= 1) return prev
      const nextTabs = prev.tabs.filter(tab => tab.id !== tabId)
      if (nextTabs.length === 0) return prev
      removeTabData(tabId)
      const nextActive = prev.activeTabId === tabId
        ? (nextTabs[nextTabs.length - 1]?.id ?? nextTabs[0]?.id ?? prev.activeTabId)
        : prev.activeTabId
      return { tabs: nextTabs, activeTabId: nextActive }
    })
  }, [updateTabsState])

  const setActiveTab = useCallback((tabId: string) => {
    updateTabsState(prev => ({ ...prev, activeTabId: tabId }))
  }, [updateTabsState])

  const renameTab = useCallback((tabId: string, title: string) => {
    updateTabsState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => (tab.id === tabId ? { ...tab, title } : tab)),
    }))
  }, [updateTabsState])

  const clearActiveTab = useCallback(() => {
    window.dispatchEvent(new Event('ai-panel:clear-active-tab'))
  }, [])

  const contextLabel = docContext.type === 'collection'
    ? `${docContext.collection} · ${docContext.id}`
    : docContext.type === 'collection-list'
      ? `Liste · ${docContext.collection}`
      : docContext.type === 'global'
        ? `global · ${docContext.slug}`
        : 'Tableau de bord'

  const activeTab = tabsState?.tabs.find(tab => tab.id === tabsState.activeTabId) ?? null

  const panel = mounted && tabsState ? (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        title="Assistant IA (⌘K)"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9997,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          background: 'var(--theme-text, #1a1a1a)',
          border: 'none',
          borderRadius: 40,
          color: '#000',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'
        }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>✦</span>
        <span>Assistant IA</span>
        <span style={{
          fontSize: 10,
          padding: '1px 5px',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 4,
          fontFamily: 'monospace',
        }}>⌘K</span>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 9998,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 440,
        maxWidth: '100vw',
        background: 'var(--theme-elevation-0, #fff)',
        borderLeft: '1px solid var(--theme-elevation-200, #e0e0e0)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderBottom: '1px solid var(--theme-elevation-200, #e0e0e0)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 18 }}>✦</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--theme-text, #1a1a1a)' }}>
              Assistant IA
            </div>
            <div style={{
              fontSize: 11,
              color: 'var(--theme-elevation-500, #888)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {contextLabel}
            </div>
          </div>
          <button
            onClick={clearActiveTab}
            title="Effacer la conversation active"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--theme-elevation-500, #888)',
              padding: '4px 8px',
              borderRadius: 4,
            }}
          >
            Effacer
          </button>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: 'var(--theme-elevation-500, #888)',
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          borderBottom: '1px solid var(--theme-elevation-200, #e0e0e0)',
          flexShrink: 0,
          minHeight: 40,
        }}>
          <div style={{
            display: 'flex',
            flex: 1,
            overflowX: 'auto',
            scrollbarWidth: 'thin',
          }}>
            {tabsState.tabs.map((tab: AiPanelTab) => {
              const isActive = tab.id === tabsState.activeTabId
              return (
                <div
                  key={tab.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    borderRight: '1px solid var(--theme-elevation-200, #e0e0e0)',
                    background: isActive ? 'var(--theme-elevation-0, #fff)' : 'var(--theme-elevation-50, #fafafa)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    title={tab.title}
                    style={{
                      padding: '8px 10px 8px 14px',
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--theme-text, #1a1a1a)' : 'var(--theme-elevation-500, #888)',
                      background: 'none',
                      border: 'none',
                      borderBottom: isActive ? '2px solid var(--theme-text, #1a1a1a)' : '2px solid transparent',
                      cursor: 'pointer',
                      maxWidth: 140,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.title}
                  </button>
                  {tabsState.tabs.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        closeTab(tab.id)
                      }}
                      title="Fermer l'onglet"
                      style={{
                        padding: '4px 8px 4px 2px',
                        fontSize: 14,
                        lineHeight: 1,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--theme-elevation-400, #aaa)',
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <button
            type="button"
            onClick={addTab}
            title="Nouvelle conversation"
            style={{
              width: 40,
              flexShrink: 0,
              fontSize: 18,
              lineHeight: 1,
              background: 'var(--theme-elevation-50, #fafafa)',
              border: 'none',
              borderLeft: '1px solid var(--theme-elevation-200, #e0e0e0)',
              cursor: 'pointer',
              color: 'var(--theme-elevation-600, #666)',
            }}
          >
            +
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {activeTab && (
            <AiPanelTabSession
              key={activeTab.id}
              tabId={activeTab.id}
              docContext={docContext}
              docContextRef={docContextRef}
              open={open}
              pendingPrompt={pendingPrompt}
              onPendingPromptConsumed={() => setPendingPrompt(null)}
              onAutoRenameTab={title => renameTab(activeTab.id, title)}
              defaultTabTitle={activeTab.title}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes ai-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .ai-panel-composer textarea {
          overflow: hidden;
          scrollbar-width: none;
        }
        .ai-panel-composer textarea::-webkit-scrollbar {
          display: none;
        }
        .ai-panel-composer textarea::placeholder {
          color: var(--theme-elevation-400, #999);
          opacity: 1;
        }
      `}</style>
    </>
  ) : null

  return (
    <>
      {children}
      {panel}
    </>
  )
}
