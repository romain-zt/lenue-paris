'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { ensureHighlightStyle, focusAdminField, scrollAndHighlight } from './live-preview/utils'

type DocContext = {
  type: 'collection' | 'global' | 'dashboard'
  collection?: string
  id?: string
  slug?: string
}

type LastEdit = {
  fields: string[]
  timestamp: Date
}

function parseAdminPath(pathname: string): DocContext {
  const parts = pathname.split('/').filter(Boolean)
  const adminIdx = parts.indexOf('admin')
  if (adminIdx === -1) return { type: 'dashboard' }
  const after = parts.slice(adminIdx + 1)
  if (after[0] === 'collections' && after[1] && after[2]) {
    return { type: 'collection', collection: after[1], id: after[2] }
  }
  if (after[0] === 'globals' && after[1]) {
    return { type: 'global', slug: after[1] }
  }
  return { type: 'dashboard' }
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return `il y a ${Math.floor(diff / 86400)}j`
}

const QUICK_ACTIONS = {
  contenu: [
    { label: 'Modifier ce contenu', prompt: 'Montre-moi les champs de ce document et aide-moi à les modifier.' },
    { label: 'Expliquer les champs', prompt: 'Explique-moi à quoi servent les différents champs de ce document.' },
    { label: 'Traduire FR/EN/RU', prompt: 'Traduis le contenu de ce document en français, anglais et russe.' },
  ],
  dev: [
    { label: 'Nouveau bloc', prompt: 'Aide-moi à créer un nouveau bloc Payload (schema + composant React).' },
    { label: 'Nouveau composant', prompt: 'Génère un composant React et pousse-le sur GitHub.' },
    { label: 'Structure du site', prompt: 'Montre-moi toutes les collections et globaux disponibles avec leurs champs.' },
  ],
}

const TONE_CHIPS = [
  { label: 'Plus court', modifier: 'Raccourcis ce texte en gardant l\'essentiel : ' },
  { label: 'Plus luxe', modifier: 'Réécris ce texte avec un ton plus élégant et premium : ' },
  { label: 'Plus direct', modifier: 'Réécris ce texte de façon plus directe et concise : ' },
]

type ToolPart = {
  type: 'tool-invocation'
  toolInvocation: {
    toolName: string
    state: string
    result?: unknown
  }
}

type MessagePart = { type: 'text'; text: string } | ToolPart | { type: string }

function ToolCallCard({ toolName, state }: { toolName: string; state: string }) {
  const labels: Record<string, string> = {
    get_document: 'Lecture du document',
    patch_field: 'Modification du contenu',
    list_schema: 'Récupération du schéma',
    push_to_github: 'Push vers GitHub',
  }
  const isLoading = state === 'partial-call' || state === 'call'
  return (
    <div style={{
      padding: '8px 12px',
      borderRadius: 6,
      background: 'var(--theme-elevation-100, #f5f5f5)',
      border: '1px solid var(--theme-elevation-200, #e0e0e0)',
      fontSize: 12,
      color: 'var(--theme-elevation-800, #444)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <span style={isLoading ? { display: 'inline-block', animation: 'ai-spin 1s linear infinite' } : {}}>
        {isLoading ? '⏳' : '✅'}
      </span>
      {labels[toolName] ?? toolName}
    </div>
  )
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'
  const parts = (message as { parts?: MessagePart[] }).parts

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      gap: 4,
      marginBottom: 12,
    }}>
      {parts && parts.length > 0 ? parts.map((part, i) => {
        if (part.type === 'text') {
          const textPart = part as { type: 'text'; text: string }
          return (
            <div key={i} style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: isUser ? 'var(--theme-text, #1a1a1a)' : 'var(--theme-elevation-100, #f5f5f5)',
              color: isUser ? 'var(--theme-elevation-0, #fff)' : 'var(--theme-text, #1a1a1a)',
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {textPart.text}
            </div>
          )
        }
        if (part.type === 'tool-invocation') {
          const toolPart = part as ToolPart
          return (
            <ToolCallCard
              key={i}
              toolName={toolPart.toolInvocation.toolName}
              state={toolPart.toolInvocation.state}
            />
          )
        }
        return null
      }) : null}
    </div>
  )
}

export const AIPanel: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'contenu' | 'dev'>('contenu')
  const [docContext, setDocContext] = useState<DocContext>({ type: 'dashboard' })
  const [input, setInput] = useState('')
  const [lastEdit, setLastEdit] = useState<LastEdit | null>(null)
  const [timeAgoDisplay, setTimeAgoDisplay] = useState('')
  const [mounted, setMounted] = useState(false)
  const [patchDone, setPatchDone] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const docContextRef = useRef(docContext)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => { ensureHighlightStyle() }, [])

  // When the admin page is opened via a deep-link like ?field=body, focus and
  // highlight the matching form field after the form has had time to render.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const field = new URLSearchParams(window.location.search).get('field')
    if (!field) return
    const timer = setTimeout(() => {
      focusAdminField(field)
      // Also try scrollAndHighlight on the exact element if focusAdminField
      // found it (focusAdminField calls scrollAndHighlight internally, so this
      // is a no-op when the element is already focused by it).
      const el = document.querySelector<HTMLElement>(
        `[data-field-path="${field}"], input[name="${field}"], textarea[name="${field}"]`,
      )
      if (el) scrollAndHighlight(el)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    docContextRef.current = docContext
  }, [docContext])

  useEffect(() => {
    const update = () => setDocContext(parseAdminPath(window.location.pathname))
    update()
    window.addEventListener('popstate', update)
    const observer = new MutationObserver(update)
    observer.observe(document, { subtree: true, childList: true })
    return () => {
      window.removeEventListener('popstate', update)
      observer.disconnect()
    }
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

  // Receive AI-help requests from the preview iframe (InlineEditor / BlockOverlay)
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
        setActiveTab('contenu')
        setInput(prompt)
        setTimeout(() => inputRef.current?.focus(), 200)
      }
    }
    window.addEventListener('message', handleIframeMessage)
    return () => window.removeEventListener('message', handleIframeMessage)
  }, [])

  // Listen for aipanel:open from CustomLivePreview or BlockOverlay (same window)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ fieldPath?: string; prompt?: string }>).detail ?? {}
      setOpen(true)
      setActiveTab('contenu')
      if (detail.prompt) {
        setInput(detail.prompt)
      } else if (detail.fieldPath) {
        setInput(`Modifier le bloc : ${detail.fieldPath}`)
      }
      setTimeout(() => inputRef.current?.focus(), 200)
    }
    window.addEventListener('aipanel:open', handler)
    return () => window.removeEventListener('aipanel:open', handler)
  }, [])

  useEffect(() => {
    if (!lastEdit) return
    const tick = () => setTimeAgoDisplay(timeAgo(lastEdit.timestamp))
    tick()
    const interval = setInterval(tick, 30000)
    return () => clearInterval(interval)
  }, [lastEdit])

  const storageKey = docContext.type === 'collection'
    ? `ai-chat-${docContext.collection}-${docContext.id}`
    : docContext.type === 'global'
      ? `ai-chat-global-${docContext.slug}`
      : 'ai-chat-dashboard'

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/ai/chat',
    prepareSendMessagesRequest: ({ body, messages: msgs, id: chatId }) => ({
      body: {
        messages: msgs,
        id: chatId,
        ...(body as Record<string, unknown>),
        context: docContextRef.current,
      },
    }),
  }), [])

  const { messages, sendMessage, status, setMessages } = useChat({
    id: storageKey,
    transport,
    onFinish: ({ message }) => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      const parts = (message as { parts?: MessagePart[] }).parts ?? []
      const patchParts = parts.filter(
        (p): p is ToolPart =>
          p.type === 'tool-invocation' &&
          (p as ToolPart).toolInvocation.toolName === 'patch_field' &&
          (p as ToolPart).toolInvocation.state === 'result',
      )
      if (patchParts.length > 0) {
        const updatedFields = patchParts.flatMap((p) => {
          const res = p.toolInvocation.result as { updatedFields?: string[] } | undefined
          return res?.updatedFields ?? []
        })
        setLastEdit({ fields: updatedFields, timestamp: new Date() })
        setPatchDone(true)
        // Notify Payload admin form to re-read the document
        document.dispatchEvent(new CustomEvent('payload:document:refetch'))
        router.refresh()
        // Highlight the first patched field in the admin form
        if (updatedFields.length > 0 && updatedFields[0]) {
          const field = updatedFields[0]
          setTimeout(() => focusAdminField(field), 300)
        }
      }
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setInput('')
    sendMessage({ text })
  }, [input, isLoading, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const sendQuickAction = useCallback((prompt: string) => {
    setOpen(true)
    sendMessage({ text: prompt })
  }, [sendMessage])

  const contextLabel = docContext.type === 'collection'
    ? `${docContext.collection} · ${docContext.id?.slice(0, 8)}…`
    : docContext.type === 'global'
      ? `global · ${docContext.slug}`
      : 'Tableau de bord'

  const panel = mounted ? (
    <>
      {/* Floating trigger button — always visible */}
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
          color: '#fff',
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

      {/* Backdrop */}
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

      {/* Drawer */}
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
        {/* Header */}
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
            onClick={() => setMessages([])}
            title="Effacer la conversation"
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

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--theme-elevation-200, #e0e0e0)',
          flexShrink: 0,
        }}>
          {(['contenu', 'dev'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? 'var(--theme-text, #1a1a1a)' : 'var(--theme-elevation-500, #888)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--theme-text, #1a1a1a)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab === 'contenu' ? 'Contenu' : 'Développement'}
            </button>
          ))}
        </div>

        {/* Dernière modification strip */}
        {activeTab === 'contenu' && lastEdit && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderBottom: '1px solid var(--theme-elevation-200, #e0e0e0)',
            background: 'var(--theme-elevation-50, #fafafa)',
            flexShrink: 0,
            fontSize: 12,
            color: 'var(--theme-elevation-600, #666)',
          }}>
            <span style={{ flex: 1 }}>
              Dernière modification{lastEdit.fields.length > 0 ? ` · ${lastEdit.fields.slice(0, 3).join(', ')}` : ''} · {timeAgoDisplay}
            </span>
            <span style={{ color: 'var(--theme-elevation-400, #aaa)', fontSize: 11, fontStyle: 'italic' }}>
              Modification IA · pas d&apos;annulation rapide
            </span>
            <button
              onClick={() => setLastEdit(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--theme-elevation-400, #aaa)',
                fontSize: 14,
                lineHeight: 1,
                padding: '0 2px',
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Patch done banner */}
        {patchDone && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderBottom: '1px solid var(--theme-elevation-200, #e0e0e0)',
            background: 'rgba(34,197,94,0.08)',
            flexShrink: 0,
            fontSize: 12,
            color: '#166534',
          }}>
            <span>✅ Contenu enregistré dans la base de données.</span>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#166534',
                border: 'none',
                borderRadius: 4,
                padding: '2px 10px',
                fontSize: 11,
                cursor: 'pointer',
                color: '#fff',
                fontWeight: 600,
                flexShrink: 0,
                marginLeft: 'auto',
              }}
            >
              Recharger
            </button>
          </div>
        )}

        {/* Quick actions */}
        <div style={{
          padding: '12px 16px 0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          flexShrink: 0,
        }}>
          {QUICK_ACTIONS[activeTab].map(action => (
            <button
              key={action.label}
              onClick={() => sendQuickAction(action.prompt)}
              disabled={isLoading}
              style={{
                padding: '5px 10px',
                fontSize: 12,
                background: 'var(--theme-elevation-100, #f5f5f5)',
                border: '1px solid var(--theme-elevation-200, #e0e0e0)',
                borderRadius: 20,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                color: 'var(--theme-text, #1a1a1a)',
                transition: 'background 0.15s',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Tone chips — contenu tab only */}
        {activeTab === 'contenu' && (
          <div style={{
            padding: '8px 16px 0',
            display: 'flex',
            gap: 6,
            flexShrink: 0,
          }}>
            {TONE_CHIPS.map(chip => (
              <button
                key={chip.label}
                onClick={() => {
                  const text = input.trim() ? chip.modifier + input : chip.modifier
                  setInput(text)
                  inputRef.current?.focus()
                }}
                disabled={isLoading}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  background: 'none',
                  border: '1px solid var(--theme-elevation-300, #ccc)',
                  borderRadius: 20,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  color: 'var(--theme-elevation-600, #666)',
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {messages.length === 0 && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '32px 24px',
              color: 'var(--theme-elevation-500, #888)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                Que puis-je faire pour vous ?
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                Modifiez du contenu, posez des questions sur la structure du site, ou créez de nouveaux composants directement depuis l&apos;admin.
              </div>
            </div>
          )}
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--theme-elevation-500, #888)',
              fontSize: 13,
              marginBottom: 12,
            }}>
              <span style={{ letterSpacing: 2 }}>···</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--theme-elevation-200, #e0e0e0)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
            background: 'var(--theme-elevation-100, #f5f5f5)',
            borderRadius: 12,
            border: '1px solid var(--theme-elevation-200, #e0e0e0)',
            padding: '8px 12px',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message… (Entrée pour envoyer, Maj+Entrée pour sauter une ligne)"
              rows={1}
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--theme-text, #1a1a1a)',
                maxHeight: 120,
                overflow: 'auto',
              }}
              onInput={e => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 120) + 'px'
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                padding: '6px 14px',
                background: 'var(--theme-text, #1a1a1a)',
                color: 'var(--theme-elevation-0, #fff)',
                border: 'none',
                borderRadius: 8,
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 500,
                opacity: isLoading || !input.trim() ? 0.5 : 1,
                transition: 'opacity 0.15s',
                flexShrink: 0,
              }}
            >
              {isLoading ? '…' : '↑'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ai-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
