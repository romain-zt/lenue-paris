'use client'

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { updateLiveField, publishDocument } from '@/app/actions/liveEdit'

// ─── Types ────────────────────────────────────────────────────────────────────

type PayloadUser = {
  id: string
  email: string
  role?: string
}

type LastPatch = {
  label: string
  timestamp: number
  previousValue?: string
  collection?: 'pages' | 'products' | 'collections'
  id?: string
  field?: string
  locale?: string
}

function relativeTime(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000)
  if (secs < 60) return `il y a ${secs} s`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `il y a ${mins} min`
  return 'il y a un moment'
}

type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'tool-invocation'; toolInvocation: { toolName: string; state: string } }
  | { type: string }

// ─── URL resolution ───────────────────────────────────────────────────────────

function parsePublicContext(adminResolution?: AdminResolution | null) {
  if (typeof window === 'undefined') return { type: 'dashboard' as const }
  const parts = window.location.pathname.split('/').filter(Boolean)
  // parts[0] = locale, parts[1] = section, parts[2] = slug
  if (parts[1] === 'produits' && parts[2]) return { type: 'collection' as const, collection: 'products', slug: parts[2] }
  if (parts[1] === 'collections' && parts[2]) return { type: 'collection' as const, collection: 'collections', slug: parts[2] }
  // Fall back to the resolved admin URL when path-based parsing can't determine context
  // (covers /livraison, /contact, /en/livraison, globals, etc.)
  if (adminResolution) return contextFromAdminUrl(adminResolution.url)
  return { type: 'dashboard' as const }
}

type AdminResolution = { url: string; title?: string; subtitle?: string }

// Fixed storefront routes that map directly to a known page slug.
// These slugs are NOT locale-scoped in Payload, so we skip locale filtering for them.
const STATIC_PAGE_SLUGS: Record<string, string> = {
  livraison: 'livraison',
  contact: 'contact',
  'a-propos': 'a-propos',
  about: 'about',
}

/** Fetch a page by slug without locale filtering, then optionally retry with locale. */
async function fetchPageBySlug(
  base: string,
  slug: string,
  locale: string,
): Promise<{ id: string; title?: string } | null> {
  // 1. Try without locale (works for fixed slugs like livraison, contact)
  const r1 = await fetch(
    `${base}/api/pages?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0`,
    { credentials: 'include' },
  )
  if (r1.ok) {
    const d = await r1.json()
    const doc = d.docs?.[0]
    if (doc?.id) {
      console.log('[resolveAdminUrl] resolved page (no-locale)', doc.id, 'slug:', slug)
      return doc
    }
  }
  // 2. Retry with locale (works for locale-scoped slugs)
  const r2 = await fetch(
    `${base}/api/pages?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0&locale=${encodeURIComponent(locale)}`,
    { credentials: 'include' },
  )
  if (r2.ok) {
    const d = await r2.json()
    const doc = d.docs?.[0]
    if (doc?.id) {
      console.log('[resolveAdminUrl] resolved page (with-locale)', doc.id, 'slug:', slug)
      return doc
    }
  }
  console.warn('[resolveAdminUrl] pages lookup returned no docs for slug:', slug)
  return null
}

async function resolveAdminUrl(): Promise<AdminResolution> {
  if (typeof window === 'undefined') return { url: '/admin' }
  const base = window.location.origin
  const parts = window.location.pathname.split('/').filter(Boolean)
  const locale = parts[0] ?? 'en'
  const seg1 = parts[1]
  const seg2 = parts[2]
  const localeLabel = locale.toUpperCase()

  try {
    // /[locale]/produits/[slug]
    if (seg1 === 'produits' && seg2) {
      const r = await fetch(
        `${base}/api/products?where[slug][equals]=${encodeURIComponent(seg2)}&limit=1&depth=0`,
        { credentials: 'include' },
      )
      if (r.ok) {
        const d = await r.json()
        const doc = d.docs?.[0]
        if (doc?.id) {
          return { url: `/admin/collections/products/${doc.id}`, title: doc.title, subtitle: `Produit · ${localeLabel}` }
        }
        console.warn('[resolveAdminUrl] products lookup returned no docs for slug:', seg2)
      } else {
        console.error('[resolveAdminUrl] products lookup failed', r.status)
      }
    }

    // /[locale]/collections/[slug]
    if (seg1 === 'collections' && seg2) {
      const r = await fetch(
        `${base}/api/collections?where[slug][equals]=${encodeURIComponent(seg2)}&limit=1&depth=0`,
        { credentials: 'include' },
      )
      if (r.ok) {
        const d = await r.json()
        const doc = d.docs?.[0]
        if (doc?.id) {
          return { url: `/admin/collections/collections/${doc.id}`, title: doc.title ?? doc.name, subtitle: `Collection · ${localeLabel}` }
        }
        console.warn('[resolveAdminUrl] collections lookup returned no docs for slug:', seg2)
      } else {
        console.error('[resolveAdminUrl] collections lookup failed', r.status)
      }
    }

    // /[locale]/[slug] — a simple page (livraison, contact, etc.)
    if (seg1 && !seg2 && seg1 !== 'produits' && seg1 !== 'collections') {
      // Check static map first so known fixed routes never waste a locale-filtered query
      const canonicalSlug = STATIC_PAGE_SLUGS[seg1] ?? seg1
      const doc = await fetchPageBySlug(base, canonicalSlug, locale)
      if (doc?.id) {
        return {
          url: `/admin/collections/pages/${doc.id}`,
          title: doc.title,
          subtitle: `Page · ${localeLabel}`,
        }
      }
    }

    // /[locale] or / — homepage
    if (!seg1) {
      for (const homeSlug of ['home', 'homepage', 'accueil', 'index']) {
        const doc = await fetchPageBySlug(base, homeSlug, locale)
        if (doc?.id) {
          return { url: `/admin/collections/pages/${doc.id}`, title: doc.title, subtitle: `Accueil · ${localeLabel}` }
        }
      }
      // Last resort: first page in the collection
      const r = await fetch(`${base}/api/pages?limit=1&depth=0`, { credentials: 'include' })
      if (r.ok) {
        const d = await r.json()
        const doc = d.docs?.[0]
        if (doc?.id) {
          return { url: `/admin/collections/pages/${doc.id}`, title: doc.title, subtitle: `Page · ${localeLabel}` }
        }
      }
      console.warn('[resolveAdminUrl] homepage lookup: no pages found')
    }
  } catch (err) {
    console.error('[resolveAdminUrl] unexpected error', err)
  }

  console.warn('[resolveAdminUrl] falling back to /admin for path:', window.location.pathname)
  return { url: '/admin' }
}

// ─── Derive Payload collection + id (or global slug) from a resolved admin URL ─

function contextFromAdminUrl(
  url: string,
):
  | { type: 'collection'; collection: string; id: string }
  | { type: 'global'; slug: string }
  | { type: 'dashboard' } {
  const collMatch = url.match(/\/admin\/collections\/([^/]+)\/([^/?#]+)/)
  if (collMatch?.[1] && collMatch?.[2]) {
    return { type: 'collection', collection: collMatch[1], id: collMatch[2] }
  }
  const globalMatch = url.match(/\/admin\/globals\/([a-z0-9-]+)/)
  if (globalMatch?.[1]) {
    return { type: 'global', slug: globalMatch[1] }
  }
  return { type: 'dashboard' }
}

// ─── AI Chat panel embedded in the FAB ───────────────────────────────────────

function AIChatPanel({
  onClose,
  pendingPrompt,
  adminResolution,
  hidden,
}: {
  onClose: () => void
  pendingPrompt?: string
  adminResolution: AdminResolution | null
  hidden?: boolean
}) {
  const [input, setInput] = useState(pendingPrompt ?? '')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Derive document context: prefer the resolved admin URL, then fall back to
  // path-based parsing (which itself falls back to adminResolution for routes
  // like /livraison that aren't handled by path matching alone).
  const contextRef = useRef(parsePublicContext(adminResolution))

  // Stable chat ID keyed by the resolved document so history is per-page
  const chatId = adminResolution?.url
    ? `public-chat-${adminResolution.url.replace(/\//g, '-')}`
    : 'public-ai-chat'

  // Keep context in sync when the admin URL resolves after mount
  useEffect(() => {
    if (adminResolution) {
      contextRef.current = contextFromAdminUrl(adminResolution.url)
    }
  }, [adminResolution])

  // Focus the textarea whenever the panel becomes visible
  useEffect(() => {
    if (!hidden) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [hidden])

  // Sync input when a new prompt comes in from BlockOverlay ✦ click
  useEffect(() => {
    if (pendingPrompt) {
      setInput(pendingPrompt)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [pendingPrompt])

  // Load persisted messages from localStorage on first render
  const [initialMessages] = useState<UIMessage[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem(chatId)
      if (!raw) return []
      return JSON.parse(raw) as UIMessage[]
    } catch {
      return []
    }
  })

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/ai/chat',
        credentials: 'include',
        prepareSendMessagesRequest: ({ body, messages: msgs, id: id_ }) => ({
          body: {
            messages: msgs,
            id: id_,
            ...(body as Record<string, unknown>),
            context: contextRef.current,
          },
        }),
      }),
    [],
  )

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: chatId,
    transport,
    onFinish: () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    },
  })

  // Hydrate chat history from localStorage once on mount
  useEffect(() => {
    if (initialMessages.length === 0) return
    setMessages(initialMessages)
  }, [initialMessages, setMessages])

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined' || messages.length === 0) return
    try {
      window.localStorage.setItem(chatId, JSON.stringify(messages))
    } catch {
      // quota exceeded — ignore
    }
  }, [messages, chatId])

  // Scan ALL messages once the stream settles — identical to the fix in AIPanel.tsx
  // (Bug 1: onFinish only fires for the last step; patch_field lives in an earlier step
  // in multi-step chains, so onFinish always missed it.)
  const processedPatchIds = useRef(new Set<string>())
  useEffect(() => {
    if (status !== 'ready') return
    for (const message of messages) {
      if (message.role !== 'assistant') continue
      if (processedPatchIds.current.has(message.id)) continue
      const parts = (message as { parts?: MessagePart[] }).parts ?? []
      for (const p of parts) {
        if (p.type !== 'tool-invocation') continue
        const tp = p as {
          type: 'tool-invocation'
          toolInvocation: {
            toolName: string
            state: string
            args?: Record<string, unknown>
            result?: { updatedFields?: string[]; success?: boolean }
          }
        }
        if (
          tp.toolInvocation.toolName === 'patch_field' &&
          tp.toolInvocation.state === 'result' &&
          tp.toolInvocation.result?.success
        ) {
          const updatedFields = tp.toolInvocation.result?.updatedFields ?? []
          const args = tp.toolInvocation.args ?? {}
          const label =
            updatedFields.length > 0
              ? updatedFields.join(', ')
              : Object.keys((args.data as Record<string, unknown> | undefined) ?? {}).join(', ') ||
                (args.collection as string) ||
                'Contenu'
          window.dispatchEvent(
            new CustomEvent('lp:field-patched', {
              detail: { label, field: updatedFields[0] ?? args.data },
            }),
          )
        }
      }
      processedPatchIds.current.add(message.id)
    }
  }, [messages, status])

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setInput('')
    sendMessage({ text })
  }, [input, isLoading, sendMessage])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        right: 20,
        width: 380,
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: '60vh',
        background: 'rgba(10,10,10,0.96)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14,
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        display: hidden ? 'none' : 'flex',
        flexDirection: 'column',
        zIndex: 9998,
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 15, color: '#a5b4fc' }}>✦</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#fff' }}>
          Assistant IA
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            padding: 4,
          }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: 12,
              lineHeight: 1.6,
              textAlign: 'center',
              padding: '16px 0',
            }}
          >
            Posez une question ou demandez une modification du contenu.
          </div>
        )}
        {messages.map((msg: UIMessage) => {
          const isUser = msg.role === 'user'
          const parts = (msg as { parts?: MessagePart[] }).parts
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                gap: 4,
              }}
            >
              {parts && parts.length > 0
                ? parts.map((part, i) => {
                    if (part.type === 'text') {
                      return (
                        <div
                          key={i}
                          style={{
                            maxWidth: '88%',
                            padding: '8px 12px',
                            borderRadius: isUser ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                            background: isUser ? '#6366f1' : 'rgba(255,255,255,0.08)',
                            color: '#fff',
                            fontSize: 12,
                            lineHeight: 1.55,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {(part as { type: 'text'; text: string }).text}
                        </div>
                      )
                    }
                    if (part.type === 'tool-invocation') {
                      const tp = part as {
                        type: 'tool-invocation'
                        toolInvocation: { toolName: string; state: string }
                      }
                      const labels: Record<string, string> = {
                        get_document: 'Lecture…',
                        patch_field: 'Modification…',
                        list_schema: 'Schéma…',
                        push_to_github: 'GitHub…',
                      }
                      const isRunning =
                        tp.toolInvocation.state === 'partial-call' ||
                        tp.toolInvocation.state === 'call'
                      return (
                        <div
                          key={i}
                          style={{
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.4)',
                            padding: '4px 0',
                          }}
                        >
                          {isRunning ? '⏳' : '✅'}{' '}
                          {labels[tp.toolInvocation.toolName] ?? tp.toolInvocation.toolName}
                        </div>
                      )
                    }
                    return null
                  })
                : null}
            </div>
          )
        })}
        {isLoading && (
          <div
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 13,
              letterSpacing: 2,
            }}
          >
            ···
          </div>
        )}
        {status === 'error' && (
          <div
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              color: '#fca5a5',
              fontSize: 11,
              lineHeight: 1.5,
              padding: '8px 10px',
            }}
          >
            ⚠ {error?.message
              ? error.message
              : <>Erreur de connexion à l&apos;IA. Vérifiez que <code style={{ fontFamily: 'monospace', fontSize: 10 }}>OPENAI_API_KEY</code> est configuré côté serveur.</>
            }
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}
      >
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 6,
            fontSize: 10,
            color: 'rgba(255,255,255,0.35)',
          }}>
            <span style={{ display: 'inline-block', animation: 'fab-spin 1s linear infinite' }}>⏳</span>
            <span>{status === 'submitted' ? 'Envoi…' : 'Génération…'}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Message… (Entrée pour envoyer)"
          rows={1}
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
            lineHeight: 1.5,
            outline: 'none',
            padding: '7px 10px',
            resize: 'none',
            maxHeight: 80,
            overflow: 'auto',
          }}
          onInput={(e) => {
            const t = e.currentTarget
            t.style.height = 'auto'
            t.style.height = Math.min(t.scrollHeight, 80) + 'px'
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          style={{
            background: '#6366f1',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            height: 34,
            opacity: isLoading || !input.trim() ? 0.4 : 1,
            padding: '0 12px',
            flexShrink: 0,
            transition: 'opacity 0.15s',
          }}
        >
          {isLoading ? '…' : '↑'}
        </button>
        </div>
      </div>
      <style>{`
        @keyframes fab-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fab-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Editor token helpers ─────────────────────────────────────────────────────

// editor_token is set as HttpOnly so document.cookie cannot read it.
// We validate it server-side via a lightweight API call instead.

// ─── Main FAB component ───────────────────────────────────────────────────────

export function PublicAdminFAB() {
  const pathname = usePathname()
  const [user, setUser] = useState<PayloadUser | null>(null)
  const [checking, setChecking] = useState(true)
  const [isEditorToken, setIsEditorToken] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [lastPatch, setLastPatch] = useState<LastPatch | null>(null)
  const [isUndoing, setIsUndoing] = useState(false)
  const [tick, setTick] = useState(0)
  const [adminResolution, setAdminResolution] = useState<AdminResolution | null>(null)
  const [resolving, setResolving] = useState(true)
  const [selectedFieldPath, setSelectedFieldPath] = useState<string | undefined>()
  // pendingPrompt: set when a BlockOverlay ✦ click triggers the AI panel
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>()
  // publish state for the strip
  const [publishState, setPublishState] = useState<'idle' | 'publishing' | 'published'>('idle')
  // toast shown for 2s when page context switches on navigation
  const [pageToast, setPageToast] = useState<string | null>(null)
  // Controls whether the top "MODE ÉDITION" banner is visible.
  // It only appears after the first edit (lastPatch is set) and auto-dismisses
  // after 8 seconds so it never blocks the site header permanently.
  const [bannerVisible, setBannerVisible] = useState(false)
  const isFirstResolution = useRef(true)

  const adminBaseUrl = adminResolution?.url ?? '/admin'
  const adminPageTitle = adminResolution?.title
  const adminPageSubtitle = adminResolution?.subtitle

  // Derived admin URL: base URL + optional ?field= param for deep-linking
  const adminUrl = selectedFieldPath
    ? `${adminBaseUrl}?field=${encodeURIComponent(selectedFieldPath)}`
    : adminBaseUrl

  // Dynamic label for the "open in admin" link
  const adminLinkLabel = resolving
    ? '↗ Cherche la page…'
    : selectedFieldPath
      ? `↗ Ce paragraphe dans l'admin`
      : adminPageTitle
        ? `↗ ${adminPageTitle} dans l'admin`
        : `↗ Ouvrir dans l'admin`

  // Restore edit mode state after page reloads (e.g. after draftMode toggle).
  // useLayoutEffect so the class is on <html> before paint and before field hooks read it.
  useLayoutEffect(() => {
    if (sessionStorage.getItem('lp-edit-mode') === '1') {
      setEditMode(true)
      document.documentElement.classList.add('admin-edit-mode')
      document.dispatchEvent(new CustomEvent('admin-edit-mode', { detail: { enabled: true } }))
    }
  }, [])

  // Handle ?editor_token= query param: exchange for HttpOnly cookie then reload clean
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const tokenParam = params.get('editor_token')
    if (!tokenParam) return

    const clean = new URL(window.location.href)
    clean.searchParams.delete('editor_token')

    fetch(`/api/editor-token?token=${encodeURIComponent(tokenParam)}&redirect=${encodeURIComponent(clean.pathname + clean.search)}`, {
      redirect: 'manual',
    })
      .then(() => {
        window.location.replace(clean.toString())
      })
      .catch(() => {
        window.location.replace(clean.toString())
      })
  }, [])

  // Check for editor_token cookie via server-side validate endpoint.
  // document.cookie cannot read HttpOnly cookies, so we delegate to the API.
  useEffect(() => {
    fetch('/api/editor-token/validate', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { ok: false }))
      .then((data: { ok?: boolean }) => {
        if (data.ok) setIsEditorToken(true)
      })
      .catch(() => {})
  }, [])

  // Check if current user is a Payload admin
  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: PayloadUser } | null) => {
        if (data?.user) setUser(data.user)
      })
      .catch(() => null)
      .finally(() => setChecking(false))
  }, [])

  // Resolve the admin URL for the current public page — re-runs on client navigation
  useEffect(() => {
    setResolving(true)
    setAdminResolution(null)
    resolveAdminUrl()
      .then((resolution) => {
        setAdminResolution(resolution)
        // Show a brief toast when the page context changes (skip on first mount)
        if (!isFirstResolution.current && resolution.title) {
          setPageToast(`Page mise à jour : ${resolution.title}`)
          setTimeout(() => setPageToast(null), 2000)
        }
        isFirstResolution.current = false
      })
      .catch(() => {})
      .finally(() => setResolving(false))
  }, [pathname])

  // Tick every 15 s to keep relative time display fresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000)
    return () => clearInterval(id)
  }, [])

  // Capture lp:field-patched events from EditableField and AI chat
  useEffect(() => {
    const handle = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {}
      setLastPatch({
        label: (detail.label as string) || (detail.field as string) || 'Contenu',
        timestamp: Date.now(),
        previousValue: detail.previousValue as string | undefined,
        collection: detail.collection as 'pages' | 'products' | 'collections' | undefined,
        id: detail.id as string | undefined,
        field: detail.field as string | undefined,
        locale: detail.locale as string | undefined,
      })
    }
    window.addEventListener('lp:field-patched', handle)
    return () => window.removeEventListener('lp:field-patched', handle)
  }, [])

  // Auto-dismiss last patch strip after 5 minutes
  useEffect(() => {
    if (!lastPatch) return
    const id = setTimeout(() => setLastPatch(null), 5 * 60 * 1000)
    return () => clearTimeout(id)
  }, [lastPatch])

  // Show the top banner when an edit lands, then auto-dismiss after 8 seconds.
  // This ensures the banner never blocks the site header before any modification.
  useEffect(() => {
    if (!lastPatch) {
      setBannerVisible(false)
      return
    }
    setBannerVisible(true)
    const id = setTimeout(() => setBannerVisible(false), 8000)
    return () => clearTimeout(id)
  }, [lastPatch])

  // Listen for AI-help messages from BlockOverlay ✦ clicks.
  // Lives here (not in AIChatPanel) so it fires even when the panel is closed.
  useEffect(() => {
    const handle = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return
      if (e.data.type === 'lp:ai-field-help') {
        const { path, label, value } = e.data as {
          path: string
          label?: string
          value?: string
        }
        const fieldName = label ?? path
        const prompt = value
          ? `Aide-moi avec le champ "${fieldName}" (${path}).\n\nValeur actuelle :\n"${value}"`
          : `Explique-moi le champ "${fieldName}" (${path}) et aide-moi à le remplir.`
        // Track which field was selected so the admin deep-link includes ?field=
        setSelectedFieldPath(path)
        setPendingPrompt(prompt)
        setAiOpen(true)
        setMenuOpen(false)
      }
    }
    window.addEventListener('message', handle)
    return () => window.removeEventListener('message', handle)
  }, [])

  // Toggle edit mode: enable draftMode on server + persist state + reload for fresh RSC content
  const toggleEditMode = useCallback(async () => {
    const next = !editMode
    setEditMode(next)
    setMenuOpen(false)

    if (next) {
      sessionStorage.setItem('lp-edit-mode', '1')
      document.documentElement.classList.add('admin-edit-mode')
      document.dispatchEvent(new CustomEvent('admin-edit-mode', { detail: { enabled: true } }))
    } else {
      sessionStorage.removeItem('lp-edit-mode')
      document.documentElement.classList.remove('admin-edit-mode')
      document.dispatchEvent(new CustomEvent('admin-edit-mode', { detail: { enabled: false } }))
    }

    // Enable/disable Next.js draftMode so RSCs bypass the cache and serve fresh Payload content
    try {
      await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: next ? 'enable' : 'disable' }),
        credentials: 'include',
      })
      window.location.reload()
    } catch {
      // draftMode toggle failed — CSS class still active, reload anyway
      window.location.reload()
    }
  }, [editMode])

  if (checking || (!user && !isEditorToken)) return null

  return (
    <>
      {/* AI Chat panel — always mounted to preserve useChat history across open/close */}
      <AIChatPanel
        onClose={() => setAiOpen(false)}
        pendingPrompt={pendingPrompt}
        adminResolution={adminResolution}
        hidden={!aiOpen}
      />

      {/* FAB menu */}
      {menuOpen && !aiOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            background: 'rgba(10,10,10,0.94)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 220,
            padding: 8,
            zIndex: 9997,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              color: isEditorToken && !user ? 'rgba(165,180,252,0.7)' : 'rgba(255,255,255,0.35)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.07em',
              padding: '4px 8px 6px',
              textTransform: 'uppercase',
            }}
          >
            {isEditorToken && !user ? 'Mode Collaborateur' : `Admin · ${user?.email.split('@')[0]}`}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', height: 1, margin: '2px 0' }} />

          {/* Edit mode toggle */}
          <button
            type="button"
            onClick={toggleEditMode}
            style={{
              alignItems: 'center',
              background: editMode ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: 'none',
              borderRadius: 7,
              color: editMode ? '#a5b4fc' : 'rgba(255,255,255,0.75)',
              cursor: 'pointer',
              display: 'flex',
              fontSize: 12,
              fontWeight: editMode ? 600 : 400,
              gap: 8,
              padding: '8px 10px',
              textAlign: 'left',
              transition: 'background 0.12s',
              width: '100%',
            }}
          >
            <span
              style={{
                background: editMode ? '#6366f1' : 'rgba(255,255,255,0.15)',
                borderRadius: 3,
                display: 'inline-block',
                fontSize: 9,
                padding: '1px 5px',
                transition: 'background 0.12s',
              }}
            >
              {editMode ? 'ON' : 'OFF'}
            </span>
            Mode édition
          </button>

          {editMode && (
            <div
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: 10,
                lineHeight: 1.4,
                padding: '0 10px 6px',
              }}
            >
              Modifications visibles après actualisation
            </div>
          )}

          {/* AI assistant */}
          <button
            type="button"
            onClick={() => {
              setPendingPrompt(undefined)
              setAiOpen(true)
              setMenuOpen(false)
            }}
            style={{
              alignItems: 'center',
              background: 'rgba(99,102,241,0.9)',
              border: 'none',
              borderRadius: 7,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              fontSize: 12,
              fontWeight: 600,
              gap: 6,
              padding: '8px 10px',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <span style={{ fontSize: 13 }}>✦</span>
            Assistant IA
          </button>

          <div style={{ background: 'rgba(255,255,255,0.06)', height: 1, margin: '2px 0' }} />

          {/* Admin panel link — resolves to the exact document in admin */}
          {resolving ? (
            <div
              style={{
                borderRadius: 7,
                color: 'rgba(255,255,255,0.3)',
                fontSize: 12,
                padding: '8px 10px',
              }}
            >
              {adminLinkLabel}
            </div>
          ) : (
            <a
              href={adminUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'transparent',
                borderRadius: 7,
                color: 'rgba(255,255,255,0.5)',
                display: 'block',
                fontSize: 12,
                padding: '8px 10px',
                textDecoration: 'none',
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'
                ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.8)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)'
              }}
            >
              {adminLinkLabel}
              {adminPageSubtitle && !selectedFieldPath && (
                <span
                  style={{
                    color: 'rgba(255,255,255,0.25)',
                    display: 'block',
                    fontSize: 10,
                    marginTop: 2,
                  }}
                >
                  {adminPageSubtitle}
                </span>
              )}
            </a>
          )}
        </div>
      )}

      {/* Page context update toast */}
      {pageToast && (
        <div
          style={{
            alignItems: 'center',
            background: 'rgba(99,102,241,0.92)',
            backdropFilter: 'blur(10px)',
            borderRadius: 8,
            bottom: 76,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            color: '#fff',
            display: 'flex',
            fontSize: 11,
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 500,
            gap: 6,
            maxWidth: 280,
            padding: '7px 12px',
            position: 'fixed',
            right: 20,
            zIndex: 9996,
            animation: 'fab-fade-in 0.2s ease',
          }}
        >
          <span style={{ fontSize: 13 }}>↗</span>
          <span>{pageToast}</span>
        </div>
      )}

      {/* Circle trigger */}
      <button
        type="button"
        title={menuOpen ? 'Fermer' : 'Menu admin'}
        onClick={() => {
          if (aiOpen) {
            setAiOpen(false)
            return
          }
          setMenuOpen((v) => !v)
        }}
        style={{
          alignItems: 'center',
          background: menuOpen || aiOpen ? 'rgba(99,102,241,0.9)' : 'rgba(10,10,10,0.88)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '50%',
          bottom: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          fontSize: menuOpen || aiOpen ? 16 : 18,
          height: 48,
          justifyContent: 'center',
          position: 'fixed',
          right: 20,
          transition: 'background 0.15s',
          userSelect: 'none',
          width: 48,
          zIndex: 9999,
        }}
      >
        {menuOpen || aiOpen ? '✕' : '✦'}
      </button>

      {/* Edit mode indicator bar — only shown after a modification, auto-dismisses after 8 s */}
      {editMode && lastPatch && bannerVisible && (
        <div
          style={{
            alignItems: 'center',
            background: 'rgba(99,102,241,0.9)',
            backdropFilter: 'blur(6px)',
            borderBottom: '1px solid rgba(99,102,241,0.5)',
            color: '#fff',
            display: 'flex',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            gap: 8,
            justifyContent: 'center',
            left: 0,
            letterSpacing: '0.04em',
            padding: '5px 16px',
            position: 'fixed',
            right: 0,
            top: 0,
            zIndex: 9996,
          }}
        >
          <span>
            MODE ÉDITION · Brouillon — les visiteurs voient la version publiée · Recharger pour
            prévisualiser
          </span>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              flexShrink: 0,
            }}
          >
            Recharger
          </button>
          <button
            onClick={toggleEditMode}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              borderRadius: 4,
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              flexShrink: 0,
            }}
          >
            Désactiver
          </button>
        </div>
      )}

      {/* Dernière modification strip — above the FAB circle */}
      {lastPatch && !aiOpen && (
        <div
          style={{
            alignItems: 'center',
            background: 'rgba(10,10,10,0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            bottom: 76,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'system-ui, sans-serif',
            gap: 6,
            minWidth: 260,
            maxWidth: 'calc(100vw - 40px)',
            padding: '10px 14px',
            position: 'fixed',
            right: 20,
            zIndex: 9997,
          }}
        >
          {/* Field label + time */}
          <div style={{ alignItems: 'center', display: 'flex', gap: 6, width: '100%' }}>
            <span style={{ fontSize: 11, fontWeight: 600, flex: 1, color: '#e0e0e0' }}>
              ✓ {lastPatch.label}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>
              {/* tick forces re-render every 15s to keep relative time fresh */}
              {relativeTime(lastPatch.timestamp + tick * 0)}
            </span>
            <button
              onClick={() => setLastPatch(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1,
                padding: '0 2px',
              }}
            >
              ×
            </button>
          </div>

          {/* Draft notice or published confirmation */}
          <p
            style={{
              color: publishState === 'published' ? 'rgba(134,239,172,0.9)' : 'rgba(255,255,255,0.35)',
              fontSize: 10,
              lineHeight: 1.4,
              margin: 0,
              transition: 'color 0.3s',
            }}
          >
            {publishState === 'published'
              ? 'Publié ✓ — la page est maintenant visible par les visiteurs'
              : 'Brouillon enregistré · les visiteurs voient la version publiée'}
          </p>

          {/* Actions row */}
          <div style={{ alignItems: 'center', display: 'flex', gap: 6, width: '100%' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#6366f1',
                border: 'none',
                borderRadius: 5,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 700,
                padding: '4px 10px',
                flexShrink: 0,
              }}
            >
              Recharger
            </button>

            {lastPatch.previousValue !== undefined &&
            lastPatch.collection &&
            lastPatch.id &&
            lastPatch.field ? (
              <button
                disabled={isUndoing}
                onClick={async () => {
                  if (!lastPatch.collection || !lastPatch.id || !lastPatch.field) return
                  setIsUndoing(true)
                  try {
                    await updateLiveField({
                      collection: lastPatch.collection,
                      id: lastPatch.id,
                      field: lastPatch.field,
                      value: lastPatch.previousValue!,
                      locale: lastPatch.locale,
                    })
                    setLastPatch(null)
                  } finally {
                    setIsUndoing(false)
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 5,
                  color: isUndoing ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
                  cursor: isUndoing ? 'not-allowed' : 'pointer',
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '4px 10px',
                  flexShrink: 0,
                }}
              >
                {isUndoing ? '…' : 'Annuler'}
              </button>
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10, fontStyle: 'italic' }}>
                Modification IA · pas d&apos;annulation rapide
              </span>
            )}

            {/* Publish now button — visible when adminResolution has a collection + id */}
            {!resolving && adminResolution && adminResolution.url !== '/admin' && (() => {
              const ctx = contextFromAdminUrl(adminResolution.url)
              if (ctx.type !== 'collection') return null
              const isPublishing = publishState === 'publishing'
              const isPublished = publishState === 'published'
              return (
                <button
                  disabled={isPublishing || isPublished}
                  onClick={async () => {
                    setPublishState('publishing')
                    try {
                      await publishDocument({
                        collection: ctx.collection as 'pages' | 'products' | 'globals',
                        id: ctx.id,
                      })
                      setPublishState('published')
                      setTimeout(() => setPublishState('idle'), 3000)
                    } catch {
                      setPublishState('idle')
                    }
                  }}
                  style={{
                    background: isPublished
                      ? 'rgba(34,197,94,0.2)'
                      : isPublishing
                        ? 'rgba(234,179,8,0.15)'
                        : 'rgba(234,179,8,0.9)',
                    border: isPublished ? '1px solid rgba(34,197,94,0.5)' : 'none',
                    borderRadius: 5,
                    color: isPublished ? 'rgba(134,239,172,0.9)' : '#000',
                    cursor: isPublishing || isPublished ? 'not-allowed' : 'pointer',
                    fontSize: 10,
                    fontWeight: 700,
                    marginLeft: 'auto',
                    opacity: isPublishing ? 0.6 : 1,
                    padding: '4px 10px',
                    flexShrink: 0,
                    transition: 'background 0.3s, color 0.3s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isPublished ? 'Publié ✓' : isPublishing ? 'Publication…' : 'Publier maintenant'}
                </button>
              )
            })()}

            {!resolving && adminResolution && adminResolution.url !== '/admin' && (
              <a
                href={adminResolution.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 10,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.75)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)'
                }}
              >
                Ouvrir dans l&apos;admin ↗
              </a>
            )}
          </div>
        </div>
      )}
    </>
  )
}
