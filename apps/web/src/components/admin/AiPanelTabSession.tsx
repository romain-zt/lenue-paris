'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import type { UIMessage } from 'ai'
import { focusAdminField } from './live-preview/utils'
import { TriageBadge } from './TriageBadge'
import { splitTriageFromMessage, type TriageInfo } from '@/lib/aiTriage'
import { createAiChatTransport } from '@/lib/aiChatTransport'
import {
  chatStorageKeyForTab,
  loadChatMessages,
  loadTabDraft,
  saveChatMessages,
  saveTabDraft,
  truncateTabTitle,
} from '@/lib/aiPanelTabs'
import type { ContentLocale } from '@repo/payload-schema/i18n/content-locales'

type DocContext = {
  type: 'collection' | 'collection-list' | 'global' | 'dashboard'
  collection?: string
  id?: string
  slug?: string
  locale?: ContentLocale
}

type LastEdit = {
  fields: string[]
  timestamp: Date
}

type ToolPart = {
  type: 'tool-invocation'
  toolInvocation: {
    toolName: string
    state: string
    args?: Record<string, unknown>
    result?: unknown
  }
}

type MessagePart = { type: 'text'; text: string } | ToolPart | { type: string }

const DOCUMENT_ACTIONS = [
  { label: 'Résumer ce document', prompt: 'Résume le contenu du document que je suis en train d\'éditer.' },
  { label: 'Modifier ce contenu', prompt: 'Montre-moi les champs de ce document et aide-moi à les modifier.' },
  { label: 'Expliquer les champs', prompt: 'Explique-moi à quoi servent les différents champs de ce document.' },
  { label: 'Traduire FR/EN/RU', prompt: 'Traduis le contenu de ce document en français, anglais et russe.' },
] as const

const BROWSE_ACTIONS = [
  { label: 'État du catalogue', prompt: 'Combien de produits publiés sont en stock ? Liste les robes disponibles.' },
  { label: 'Page livraison', prompt: 'Où parle-t-on de la livraison sur le site ?' },
  { label: 'Vue du site', prompt: 'Donne-moi un aperçu de l\'état actuel du site (marque, compteurs, contenu publié).' },
  { label: 'Couleurs du site', prompt: 'Quelle est la couleur accent et les principaux design tokens ?' },
] as const

const DEV_ACTIONS = [
  { label: 'Nouveau bloc', prompt: 'Aide-moi à créer un nouveau bloc Payload (schema + composant React). Cherche d\'abord dans le code comment les blocs existants sont structurés, puis donne-moi le plan.' },
  { label: 'Où est… ?', prompt: 'Où est définie la collection users dans le code ? Donne les fichiers et les numéros de ligne.' },
  { label: 'Structure du site', prompt: 'Montre-moi toutes les collections et globaux disponibles avec leurs champs.' },
] as const

const TONE_CHIPS = [
  { label: 'Plus court', modifier: 'Raccourcis ce texte en gardant l\'essentiel : ' },
  { label: 'Plus luxe', modifier: 'Réécris ce texte avec un ton plus élégant et premium : ' },
  { label: 'Plus direct', modifier: 'Réécris ce texte de façon plus directe et concise : ' },
] as const

function getQuickActions(
  docContext: DocContext,
): readonly { label: string; prompt: string }[] {
  const contentActions = docContext.type === 'collection' && docContext.collection && docContext.id
    ? DOCUMENT_ACTIONS
    : BROWSE_ACTIONS
  return [...contentActions, ...DEV_ACTIONS]
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return `il y a ${Math.floor(diff / 86400)}j`
}

function ToolCallCard({ toolName, state }: { toolName: string; state: string }) {
  const labels: Record<string, string> = {
    get_document: 'Lecture du document',
    patch_field: 'Modification du contenu',
    get_schema: 'Récupération du schéma',
    search_content: 'Recherche dans la base',
    semantic_search: 'Recherche sémantique',
    get_site_snapshot: 'Instantané du site',
    get_catalog: 'État du catalogue',
    get_home_page: 'Page d\'accueil',
    search_code: 'Recherche dans le code',
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

function MessageBubble({
  message,
  fallbackTriage,
}: {
  message: UIMessage
  fallbackTriage?: TriageInfo | null
}) {
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
          const { triage, body } = !isUser
            ? splitTriageFromMessage(textPart.text)
            : { triage: null, body: textPart.text }
          const displayTriage = triage ?? (!isUser ? fallbackTriage : null)
          return (
            <React.Fragment key={i}>
              {displayTriage && <TriageBadge triage={displayTriage} variant="admin" />}
              <div style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isUser ? 'var(--theme-text, #1a1a1a)' : 'var(--theme-elevation-100, #f5f5f5)',
                color: isUser ? 'var(--theme-elevation-0, #fff)' : 'var(--theme-text, #1a1a1a)',
                fontSize: 13,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {body}
              </div>
            </React.Fragment>
          )
        }
        if (part.type === 'tool-invocation') {
          const tp = part as ToolPart
          return (
            <ToolCallCard
              key={i}
              toolName={tp.toolInvocation.toolName}
              state={tp.toolInvocation.state}
            />
          )
        }
        return null
      }) : null}
    </div>
  )
}

export type AiPanelTabSessionProps = {
  tabId: string
  docContext: DocContext
  docContextRef: React.MutableRefObject<DocContext>
  open: boolean
  pendingPrompt: string | null
  onPendingPromptConsumed: () => void
  onAutoRenameTab: (title: string) => void
  defaultTabTitle: string
}

export function AiPanelTabSession({
  tabId,
  docContext,
  docContextRef,
  open,
  pendingPrompt,
  onPendingPromptConsumed,
  onAutoRenameTab,
  defaultTabTitle,
}: AiPanelTabSessionProps) {
  const router = useRouter()
  const chatId = chatStorageKeyForTab(tabId)

  const [input, setInput] = useState(() => loadTabDraft(tabId))
  const [lastEdit, setLastEdit] = useState<LastEdit | null>(null)
  const [timeAgoDisplay, setTimeAgoDisplay] = useState('')
  const [patchDone, setPatchDone] = useState(false)
  const [autoReloadCountdown, setAutoReloadCountdown] = useState(0)
  const autoReloadRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const processedPatchIds = useRef(new Set<string>())
  const renamedRef = useRef(false)

  const [serverTriage, setServerTriage] = useState<TriageInfo | null>(null)
  const [initialMessages] = useState<UIMessage[]>(() => loadChatMessages(tabId))

  const cancelAutoReload = useCallback(() => {
    if (autoReloadRef.current) clearInterval(autoReloadRef.current)
    autoReloadRef.current = null
    setAutoReloadCountdown(0)
  }, [])

  useEffect(() => {
    if (!patchDone) return
    setAutoReloadCountdown(3)
    autoReloadRef.current = setInterval(() => {
      setAutoReloadCountdown((c) => {
        if (c <= 1) {
          if (autoReloadRef.current) clearInterval(autoReloadRef.current)
          autoReloadRef.current = null
          window.location.reload()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => {
      if (autoReloadRef.current) clearInterval(autoReloadRef.current)
    }
  }, [patchDone])

  useEffect(() => {
    if (!lastEdit) return
    const tick = () => setTimeAgoDisplay(timeAgo(lastEdit.timestamp))
    tick()
    const interval = setInterval(tick, 30000)
    return () => clearInterval(interval)
  }, [lastEdit])

  useEffect(() => {
    saveTabDraft(tabId, input)
  }, [tabId, input])

  useEffect(() => {
    if (!pendingPrompt) return
    setInput(pendingPrompt)
    onPendingPromptConsumed()
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [pendingPrompt, onPendingPromptConsumed])

  const chatTransport = useMemo(() => createAiChatTransport({
    surface: 'admin',
    getContext: () => docContextRef.current,
    onServerTriage: setServerTriage,
  }), [docContextRef])

  const { messages, sendMessage, status, setMessages, error } = useChat({
    id: chatId,
    transport: chatTransport,
    messages: initialMessages,
    onFinish: () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    },
  })

  useEffect(() => {
    saveChatMessages(tabId, messages)
  }, [tabId, messages])

  const processPatchMessages = useCallback((
    chatMessages: UIMessage[],
    chatStatus: typeof status,
  ) => {
    if (chatStatus !== 'ready') return

    for (const message of chatMessages) {
      if (message.role !== 'assistant') continue
      if (processedPatchIds.current.has(message.id)) continue

      const parts = (message as { parts?: MessagePart[] }).parts ?? []
      const successfulPatches = parts.filter((p): p is ToolPart => {
        if (p.type !== 'tool-invocation') return false
        const tp = p as ToolPart
        if (tp.toolInvocation.toolName !== 'patch_field') return false
        if (tp.toolInvocation.state !== 'result') return false
        const res = tp.toolInvocation.result as { success?: boolean } | undefined
        return res?.success === true
      })

      processedPatchIds.current.add(message.id)

      if (successfulPatches.length === 0) continue

      const updatedFields = successfulPatches.flatMap((p) => {
        const res = p.toolInvocation.result as { updatedFields?: string[] } | undefined
        return res?.updatedFields ?? []
      })

      setLastEdit({ fields: updatedFields, timestamp: new Date() })
      setPatchDone(true)

      window.dispatchEvent(new CustomEvent('lp:ai-patch-done', { detail: { fields: updatedFields } }))
      document.dispatchEvent(new CustomEvent('payload:document:refetch'))
      router.refresh()

      if (updatedFields.length > 0 && updatedFields[0]) {
        const field = updatedFields[0]
        setTimeout(() => focusAdminField(field), 400)
      }
    }
  }, [router])

  useEffect(() => {
    processPatchMessages(messages, status)
  }, [messages, status, processPatchMessages])

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    if (!open) return
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }, 100)
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const maybeRenameTab = useCallback((text: string) => {
    if (renamedRef.current) return
    if (!text.trim()) return
    renamedRef.current = true
    onAutoRenameTab(truncateTabTitle(text))
  }, [onAutoRenameTab])

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return
    const text = input.trim()
    if (messages.length === 0 && defaultTabTitle.startsWith('Conversation ')) {
      maybeRenameTab(text)
    }
    setServerTriage(null)
    setInput('')
    saveTabDraft(tabId, '')
    sendMessage({ text })
  }, [input, isLoading, sendMessage, messages.length, defaultTabTitle, maybeRenameTab, tabId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const sendQuickAction = useCallback((prompt: string) => {
    if (messages.length === 0 && defaultTabTitle.startsWith('Conversation ')) {
      maybeRenameTab(prompt)
    }
    setServerTriage(null)
    sendMessage({ text: prompt })
  }, [sendMessage, messages.length, defaultTabTitle, maybeRenameTab])

  const handleClear = useCallback(() => {
    setMessages([])
    saveChatMessages(tabId, [])
  }, [setMessages, tabId])

  useEffect(() => {
    const handler = () => handleClear()
    window.addEventListener('ai-panel:clear-active-tab', handler)
    return () => window.removeEventListener('ai-panel:clear-active-tab', handler)
  }, [handleClear])

  const quickActions = getQuickActions(docContext)
  const showToneChips = docContext.type === 'collection' && !!docContext.collection && !!docContext.id
  const lastAssistantMessageId = [...messages].reverse().find(msg => msg.role === 'assistant')?.id

  return (
    <>
      {lastEdit && (
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
          <span>✅ Enregistré · le formulaire se recharge {autoReloadCountdown > 0 ? `dans ${autoReloadCountdown}s` : '…'}</span>
          <button
            onClick={() => { cancelAutoReload(); setPatchDone(false) }}
            style={{
              background: 'transparent',
              border: '1px solid #166534',
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 11,
              cursor: 'pointer',
              color: '#166534',
              flexShrink: 0,
              marginLeft: 'auto',
            }}
          >
            Annuler
          </button>
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
            }}
          >
            Recharger maintenant
          </button>
        </div>
      )}

      <div style={{
        padding: '12px 16px 0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        flexShrink: 0,
      }}>
        {quickActions.map(action => (
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

      {showToneChips && (
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
              Modifiez le contenu, explorez le catalogue ou posez des questions techniques sur le code.
              L&apos;assistant classe chaque demande en Contenu ou Développement.
            </div>
          </div>
        )}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            fallbackTriage={
              msg.id === lastAssistantMessageId && msg.role === 'assistant'
                ? serverTriage
                : null
            }
          />
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
        {status === 'error' && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '10px 12px',
            marginBottom: 8,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8,
            fontSize: 12,
            color: '#b91c1c',
            lineHeight: 1.5,
          }}>
            <span style={{ flexShrink: 0 }}>⚠</span>
            <div style={{ flex: 1 }}>
              <div>
                {error?.message?.includes('server_error') || error?.message?.includes('An error occurred')
                  ? 'Erreur serveur temporaire (OpenAI). Réessayez dans quelques secondes.'
                  : error?.message
                    ? error.message
                    : 'Erreur de connexion à l\'IA. Vérifiez que OPENAI_API_KEY est configuré.'
                }
              </div>
              <button
                type="button"
                onClick={() => {
                  if (input.trim()) handleSend()
                }}
                style={{
                  marginTop: 6,
                  padding: '3px 10px',
                  fontSize: 11,
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 5,
                  color: '#b91c1c',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                ↺ Réessayer
              </button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--theme-elevation-200, #e0e0e0)',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 10,
          color: 'var(--theme-elevation-400, #bbb)',
          marginBottom: 6,
          letterSpacing: '0.02em',
        }}>
          Triage automatique · Contenu ou Développement
          {' · Entrée envoie · Maj+Entrée nouvelle ligne'}
        </div>
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 6,
            fontSize: 11,
            color: 'var(--theme-elevation-500, #888)',
          }}>
            <span style={{ display: 'inline-block', animation: 'ai-spin 1s linear infinite', fontSize: 13 }}>⏳</span>
            <span>{status === 'submitted' ? 'Envoi en cours…' : 'Génération…'}</span>
          </div>
        )}
        <div
          className="ai-panel-composer"
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            background: 'var(--theme-elevation-50, #fafafa)',
            borderRadius: 14,
            border: `1px solid ${isLoading ? 'rgba(99,102,241,0.45)' : 'var(--theme-elevation-150, #e8e8e8)'}`,
            padding: '6px 6px 6px 14px',
            transition: 'border-color 0.15s',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            rows={1}
            disabled={isLoading}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 24,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: 13,
              lineHeight: 1.5,
              padding: '8px 0',
              margin: 0,
              color: 'var(--theme-text, #1a1a1a)',
              maxHeight: 120,
              overflow: 'hidden',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
            onInput={e => {
              const t = e.currentTarget
              t.style.height = 'auto'
              const next = Math.min(t.scrollHeight, 120)
              t.style.height = `${next}px`
              t.style.overflow = t.scrollHeight > 120 ? 'auto' : 'hidden'
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            aria-label="Envoyer"
            style={{
              width: 36,
              height: 36,
              minWidth: 36,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: input.trim() && !isLoading
                ? 'var(--theme-text, #1a1a1a)'
                : 'var(--theme-elevation-150, #e5e5e5)',
              color: input.trim() && !isLoading
                ? 'var(--theme-elevation-0, #fff)'
                : 'var(--theme-elevation-400, #999)',
              border: 'none',
              borderRadius: 10,
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: 16,
              lineHeight: 1,
              fontWeight: 600,
              flexShrink: 0,
              transition: 'background 0.15s, color 0.15s, transform 0.1s',
            }}
          >
            {isLoading ? '…' : '↑'}
          </button>
        </div>
      </div>
    </>
  )
}
