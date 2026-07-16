import type { UIMessage } from 'ai'

export const AI_PANEL_TABS_STORAGE_KEY = 'ai-panel-tabs-v1'
export const PUBLIC_AI_PANEL_TABS_STORAGE_KEY = 'public-ai-panel-tabs-v1'

const LEGACY_CHAT_KEYS = [
  'ai-chat-dashboard',
  'ai-chat-list-pages',
  'ai-chat-list-products',
  'ai-chat-list-collections',
  'ai-chat-list-media',
] as const

export type AiPanelTab = {
  id: string
  title: string
  createdAt: number
}

export type AiPanelTabsState = {
  tabs: AiPanelTab[]
  activeTabId: string
}

export function chatStorageKeyForTab(tabId: string): string {
  return `ai-chat-tab-${tabId}`
}

export function draftStorageKeyForTab(tabId: string): string {
  return `ai-panel-draft-${tabId}`
}

export function createTabId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function nextDefaultTabTitle(tabs: AiPanelTab[]): string {
  const used = new Set(
    tabs
      .map(tab => /^Conversation (\d+)$/.exec(tab.title)?.[1])
      .filter((n): n is string => !!n)
      .map(n => parseInt(n, 10)),
  )
  let index = 1
  while (used.has(index)) index += 1
  return `Conversation ${index}`
}

export function createDefaultTab(title?: string): AiPanelTab {
  return {
    id: createTabId(),
    title: title ?? 'Conversation 1',
    createdAt: Date.now(),
  }
}

function isValidTabsState(value: unknown): value is AiPanelTabsState {
  if (!value || typeof value !== 'object') return false
  const state = value as AiPanelTabsState
  if (!Array.isArray(state.tabs) || state.tabs.length === 0) return false
  if (typeof state.activeTabId !== 'string') return false
  return state.tabs.every(
    tab =>
      typeof tab.id === 'string'
      && typeof tab.title === 'string'
      && typeof tab.createdAt === 'number',
  )
}

export function loadTabsState(storageKey = AI_PANEL_TABS_STORAGE_KEY): AiPanelTabsState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isValidTabsState(parsed)) return null
    if (!parsed.tabs.some(tab => tab.id === parsed.activeTabId)) {
      return { tabs: parsed.tabs, activeTabId: parsed.tabs[0]?.id ?? parsed.activeTabId }
    }
    return parsed
  } catch {
    return null
  }
}

export function saveTabsState(state: AiPanelTabsState, storageKey = AI_PANEL_TABS_STORAGE_KEY): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  } catch {
    // quota exceeded — ignore
  }
}

export function loadChatMessages(tabId: string): UIMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(chatStorageKeyForTab(tabId))
    if (!raw) return []
    return JSON.parse(raw) as UIMessage[]
  } catch {
    return []
  }
}

export function saveChatMessages(tabId: string, messages: UIMessage[]): void {
  if (typeof window === 'undefined') return
  try {
    if (messages.length === 0) {
      window.localStorage.removeItem(chatStorageKeyForTab(tabId))
      return
    }
    window.localStorage.setItem(chatStorageKeyForTab(tabId), JSON.stringify(messages))
  } catch {
    // quota exceeded — ignore
  }
}

export function loadTabDraft(tabId: string): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(draftStorageKeyForTab(tabId)) ?? ''
}

export function saveTabDraft(tabId: string, draft: string): void {
  if (typeof window === 'undefined') return
  try {
    if (!draft.trim()) {
      window.localStorage.removeItem(draftStorageKeyForTab(tabId))
      return
    }
    window.localStorage.setItem(draftStorageKeyForTab(tabId), draft)
  } catch {
    // quota exceeded — ignore
  }
}

export function removeTabData(tabId: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(chatStorageKeyForTab(tabId))
  window.localStorage.removeItem(draftStorageKeyForTab(tabId))
}

function loadAllLegacyMessages(): { key: string; messages: UIMessage[] }[] {
  if (typeof window === 'undefined') return []
  const results: { key: string; messages: UIMessage[] }[] = []
  const seen = new Set<string>()

  for (const key of LEGACY_CHAT_KEYS) {
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) continue
      const messages = JSON.parse(raw) as UIMessage[]
      if (messages.length > 0 && !seen.has(key)) {
        seen.add(key)
        results.push({ key, messages })
      }
    } catch {
      continue
    }
  }

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!key || !key.startsWith('ai-chat-') || key.startsWith('ai-chat-tab-')) continue
    if (seen.has(key)) continue
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) continue
      const messages = JSON.parse(raw) as UIMessage[]
      if (messages.length > 0) {
        seen.add(key)
        results.push({ key, messages })
      }
    } catch {
      continue
    }
  }

  return results
}

function legacyKeyToTitle(key: string): string {
  if (key === 'ai-chat-dashboard') return 'Tableau de bord'
  if (key.startsWith('ai-chat-list-')) return `Liste · ${key.replace('ai-chat-list-', '')}`
  if (key.startsWith('ai-chat-global-')) return `Global · ${key.replace('ai-chat-global-', '')}`
  const docMatch = /^ai-chat-([^-]+)-(.+)$/.exec(key)
  if (docMatch) return `${docMatch[1]} · ${docMatch[2]}`
  return 'Conversation importée'
}

function loadAllPublicLegacyMessages(): { key: string; messages: UIMessage[] }[] {
  if (typeof window === 'undefined') return []
  const results: { key: string; messages: UIMessage[] }[] = []
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!key || !key.startsWith('public-chat-')) continue
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) continue
      const messages = JSON.parse(raw) as UIMessage[]
      if (messages.length > 0) results.push({ key, messages })
    } catch {
      continue
    }
  }
  return results
}

function publicLegacyKeyToTitle(key: string): string {
  const slug = key.replace(/^public-chat-/, '').replace(/-/g, ' / ')
  return slug ? `Page · ${slug}` : 'Conversation importée'
}

/** Load persisted tabs or migrate legacy single-chat keys. */
export function loadOrInitTabsState(storageKey = AI_PANEL_TABS_STORAGE_KEY): AiPanelTabsState {
  const existing = loadTabsState(storageKey)
  if (existing) return existing

  const legacyChats = storageKey === PUBLIC_AI_PANEL_TABS_STORAGE_KEY
    ? loadAllPublicLegacyMessages()
    : loadAllLegacyMessages()

  if (legacyChats.length > 0) {
    const tabs = legacyChats.map(({ key, messages }) => {
      const title = storageKey === PUBLIC_AI_PANEL_TABS_STORAGE_KEY
        ? publicLegacyKeyToTitle(key)
        : legacyKeyToTitle(key)
      const tab = createDefaultTab(title)
      saveChatMessages(tab.id, messages)
      return tab
    })
    const state: AiPanelTabsState = {
      tabs,
      activeTabId: tabs[0]?.id ?? createTabId(),
    }
    saveTabsState(state, storageKey)
    return state
  }

  const tab = createDefaultTab()
  const state: AiPanelTabsState = { tabs: [tab], activeTabId: tab.id }
  saveTabsState(state, storageKey)
  return state
}

export function loadOrInitPublicTabsState(): AiPanelTabsState {
  return loadOrInitTabsState(PUBLIC_AI_PANEL_TABS_STORAGE_KEY)
}

export function truncateTabTitle(text: string, maxLen = 28): string {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= maxLen) return oneLine
  return `${oneLine.slice(0, maxLen - 1)}…`
}
