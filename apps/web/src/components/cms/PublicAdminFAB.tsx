'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'

// ─── Types ────────────────────────────────────────────────────────────────────

type PayloadUser = {
  id: string
  email: string
  role?: string
}

type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'tool-invocation'; toolInvocation: { toolName: string; state: string } }
  | { type: string }

// ─── URL resolution ───────────────────────────────────────────────────────────

function parsePublicContext() {
  if (typeof window === 'undefined') return { type: 'dashboard' as const }
  const parts = window.location.pathname.split('/').filter(Boolean)
  // parts[0] = locale, parts[1] = section, parts[2] = slug
  if (parts[1] === 'produits' && parts[2]) return { type: 'collection' as const, collection: 'products', slug: parts[2] }
  if (parts[1] === 'collections' && parts[2]) return { type: 'collection' as const, collection: 'collections', slug: parts[2] }
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

// ─── AI Chat panel embedded in the FAB ───────────────────────────────────────

function AIChatPanel({
  onClose,
  pendingPrompt,
}: {
  onClose: () => void
  pendingPrompt?: string
}) {
  const [input, setInput] = useState(pendingPrompt ?? '')
  const [patchedSinceOpen, setPatchedSinceOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const contextRef = useRef(parsePublicContext())

  // Sync input when a new prompt comes in from BlockOverlay ✦ click
  useEffect(() => {
    if (pendingPrompt) {
      setInput(pendingPrompt)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [pendingPrompt])

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/ai/chat',
        credentials: 'include',
        prepareSendMessagesRequest: ({ body, messages: msgs, id: chatId }) => ({
          body: {
            messages: msgs,
            id: chatId,
            ...(body as Record<string, unknown>),
            context: contextRef.current,
          },
        }),
      }),
    [],
  )

  const { messages, sendMessage, status } = useChat({
    id: 'public-ai-chat',
    transport,
    onFinish: ({ message }) => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      // Detect if a patch_field tool call completed — show reload hint
      const parts = (message as { parts?: MessagePart[] }).parts ?? []
      const hadPatch = parts.some(
        (p) =>
          p.type === 'tool-invocation' &&
          (p as { type: 'tool-invocation'; toolInvocation: { toolName: string; state: string } })
            .toolInvocation.toolName === 'patch_field',
      )
      if (hadPatch) setPatchedSinceOpen(true)
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [])

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
        display: 'flex',
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

      {/* Patch hint */}
      {patchedSinceOpen && (
        <div
          style={{
            padding: '8px 14px',
            background: 'rgba(99,102,241,0.15)',
            borderBottom: '1px solid rgba(99,102,241,0.2)',
            fontSize: 11,
            color: '#c7d2fe',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span style={{ flex: 1 }}>
            ✅ Modification enregistrée · Rechargez pour voir les changements
          </span>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#6366f1',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              flexShrink: 0,
            }}
          >
            Recharger
          </button>
        </div>
      )}

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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
          flexShrink: 0,
        }}
      >
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
  )
}

// ─── Main FAB component ───────────────────────────────────────────────────────

export function PublicAdminFAB() {
  const [user, setUser] = useState<PayloadUser | null>(null)
  const [checking, setChecking] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [adminResolution, setAdminResolution] = useState<AdminResolution | null>(null)
  const [resolving, setResolving] = useState(true)
  const [selectedFieldPath, setSelectedFieldPath] = useState<string | undefined>()
  // pendingPrompt: set when a BlockOverlay ✦ click triggers the AI panel
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>()

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

  // Resolve the admin URL for the current public page
  useEffect(() => {
    setResolving(true)
    resolveAdminUrl()
      .then((resolution) => {
        setAdminResolution(resolution)
      })
      .catch(() => {})
      .finally(() => setResolving(false))
  }, [])

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

  // Toggle edit mode: add CSS class + dispatch event for BlockOverlay
  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('admin-edit-mode')
      } else {
        document.documentElement.classList.remove('admin-edit-mode')
      }
      document.dispatchEvent(new CustomEvent('admin-edit-mode', { detail: { enabled: next } }))
      return next
    })
  }, [])

  if (checking || !user) return null

  return (
    <>
      {/* AI Chat panel */}
      {aiOpen && (
        <AIChatPanel
          key={pendingPrompt}
          onClose={() => setAiOpen(false)}
          pendingPrompt={pendingPrompt}
        />
      )}

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
              color: 'rgba(255,255,255,0.35)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.07em',
              padding: '4px 8px 6px',
              textTransform: 'uppercase',
            }}
          >
            Admin · {user.email.split('@')[0]}
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

      {/* Edit mode indicator bar */}
      {editMode && (
        <div
          style={{
            background: 'rgba(99,102,241,0.9)',
            backdropFilter: 'blur(6px)',
            borderBottom: '1px solid rgba(99,102,241,0.5)',
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            left: 0,
            letterSpacing: '0.05em',
            padding: '5px 16px',
            position: 'fixed',
            right: 0,
            textAlign: 'center',
            top: 0,
            zIndex: 9996,
          }}
        >
          MODE ÉDITION · Survolez un bloc pour interagir · Modifications visibles après
          actualisation
          <button
            onClick={toggleEditMode}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 700,
              marginLeft: 12,
              padding: '2px 8px',
            }}
          >
            Désactiver
          </button>
        </div>
      )}
    </>
  )
}
