'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useChat, type Message } from 'ai/react'

type DocContext = {
  type: 'collection' | 'global' | 'dashboard'
  collection?: string
  id?: string
  slug?: string
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

const QUICK_ACTIONS = {
  contenu: [
    { label: 'Modifier ce contenu', prompt: 'Montre-moi les champs de ce document et aide-moi à les modifier.' },
    { label: 'Expliquer les champs', prompt: 'Explique-moi à quoi servent les différents champs de ce document.' },
    { label: 'Traduire en FR/EN/RU', prompt: 'Traduis le contenu de ce document en français, anglais et russe.' },
  ],
  dev: [
    { label: 'Nouveau bloc', prompt: 'Aide-moi à créer un nouveau bloc Payload (schema + composant React).' },
    { label: 'Nouveau composant', prompt: 'Génère un composant React et pousse-le sur GitHub.' },
    { label: 'Voir la structure', prompt: 'Montre-moi toutes les collections et globaux disponibles avec leurs champs.' },
  ],
}

const TONE_CHIPS = [
  { label: 'Plus court', modifier: 'Raccourcis ce texte en gardant l\'essentiel : ' },
  { label: 'Plus luxe', modifier: 'Réécris ce texte avec un ton plus élégant et premium : ' },
  { label: 'Plus direct', modifier: 'Réécris ce texte de façon plus directe et concise : ' },
]

function ToolCallCard({ toolName, state }: { toolName: string; state: string }) {
  const labels: Record<string, string> = {
    get_document: '📖 Lecture du document',
    patch_field: '✏️ Modification du contenu',
    list_collections: '📋 Récupération du schéma',
    push_to_github: '🚀 Push vers GitHub',
  }
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
      {state === 'call' || state === 'partial-call' ? (
        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
      ) : (
        <span>✅</span>
      )}
      {labels[toolName] ?? toolName}
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const parts = (message as { parts?: Array<{ type: string; text?: string; toolName?: string; state?: string }> }).parts

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      gap: 4,
      marginBottom: 12,
    }}>
      {parts ? parts.map((part, i) => {
        if (part.type === 'text' && part.text) {
          return (
            <div key={i} style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: isUser
                ? 'var(--theme-text, #1a1a1a)'
                : 'var(--theme-elevation-100, #f5f5f5)',
              color: isUser
                ? 'var(--theme-elevation-0, #fff)'
                : 'var(--theme-text, #1a1a1a)',
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {part.text}
            </div>
          )
        }
        if (part.type === 'tool-invocation') {
          return <ToolCallCard key={i} toolName={part.toolName ?? ''} state={part.state ?? ''} />
        }
        return null
      }) : (
        <div style={{
          maxWidth: '85%',
          padding: '10px 14px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser
            ? 'var(--theme-text, #1a1a1a)'
            : 'var(--theme-elevation-100, #f5f5f5)',
          color: isUser
            ? 'var(--theme-elevation-0, #fff)'
            : 'var(--theme-text, #1a1a1a)',
          fontSize: 13,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {message.content}
        </div>
      )}
    </div>
  )
}

export const AIPanel: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'contenu' | 'dev'>('contenu')
  const [docContext, setDocContext] = useState<DocContext>({ type: 'dashboard' })
  const [toneTarget, setToneTarget] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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

  const storageKey = docContext.type === 'collection'
    ? `ai-chat-${docContext.collection}-${docContext.id}`
    : docContext.type === 'global'
      ? `ai-chat-global-${docContext.slug}`
      : 'ai-chat-dashboard'

  const { messages, input, handleSubmit, setInput, isLoading, append, setMessages } = useChat({
    api: '/api/ai/chat',
    id: storageKey,
    body: { context: docContext },
    onFinish: () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    },
  })

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

  const sendQuickAction = useCallback((prompt: string) => {
    append({ role: 'user', content: prompt })
  }, [append])

  const sendWithTone = useCallback((modifier: string) => {
    if (!toneTarget.trim()) {
      setInput(modifier)
      inputRef.current?.focus()
      return
    }
    append({ role: 'user', content: modifier + toneTarget })
    setToneTarget('')
  }, [toneTarget, append, setInput])

  const contextLabel = docContext.type === 'collection'
    ? `${docContext.collection} · ${docContext.id?.slice(0, 8)}…`
    : docContext.type === 'global'
      ? `global · ${docContext.slug}`
      : 'Tableau de bord'

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <>
      {/* Trigger button in nav */}
      <div style={{ padding: '8px 16px 16px' }}>
        <button
          onClick={() => setOpen(true)}
          title="Assistant IA (⌘K)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '10px 12px',
            background: 'var(--theme-elevation-100, rgba(255,255,255,0.06))',
            border: '1px solid var(--theme-elevation-200, rgba(255,255,255,0.1))',
            borderRadius: 8,
            color: 'var(--theme-elevation-700, #ccc)',
            cursor: 'pointer',
            fontSize: 13,
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--theme-elevation-150, rgba(255,255,255,0.1))'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--theme-elevation-100, rgba(255,255,255,0.06))'
          }}
        >
          <span style={{ fontSize: 16 }}>✦</span>
          <span style={{ flex: 1, textAlign: 'left' }}>Assistant IA</span>
          <span style={{
            fontSize: 10,
            padding: '2px 6px',
            background: 'var(--theme-elevation-200, rgba(255,255,255,0.1))',
            borderRadius: 4,
            fontFamily: 'monospace',
          }}>⌘K</span>
        </button>
      </div>

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
        width: 420,
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
                onClick={() => sendWithTone(chip.modifier)}
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
                Modifiez du contenu, posez des questions sur la structure du site, ou créez de nouveaux composants.
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

        {/* Tone target input — shown when tone chips are used */}
        {activeTab === 'contenu' && toneTarget && (
          <div style={{ padding: '0 16px', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--theme-elevation-500)', marginBottom: 4 }}>
              Texte à transformer (laissez vide pour cibler le document actuel)
            </div>
            <textarea
              value={toneTarget}
              onChange={e => setToneTarget(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid var(--theme-elevation-300, #ccc)',
                background: 'var(--theme-elevation-50, #fafafa)',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--theme-elevation-200, #e0e0e0)',
          flexShrink: 0,
        }}>
          <form onSubmit={handleSubmit}>
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
                type="submit"
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
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
