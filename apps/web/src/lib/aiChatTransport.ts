import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { AI_TRIAGE_HEADER, parseTriageHeader, type TriageInfo } from '@/lib/aiTriage'

type DocContext = {
  type: 'collection' | 'collection-list' | 'global' | 'dashboard'
  collection?: string
  id?: string
  slug?: string
  locale?: string
}

type CreateAiChatTransportOptions = {
  surface: 'admin' | 'storefront'
  getContext: () => DocContext
  onServerTriage?: (triage: TriageInfo | null) => void
}

export function createAiChatTransport({
  surface,
  getContext,
  onServerTriage,
}: CreateAiChatTransportOptions): DefaultChatTransport<UIMessage> {
  return new DefaultChatTransport({
    api: '/api/ai/chat',
    credentials: 'include',
    fetch: async (input, init) => {
      const response = await fetch(input, init)
      if (onServerTriage) {
        onServerTriage(parseTriageHeader(response.headers.get(AI_TRIAGE_HEADER)))
      }
      return response
    },
    prepareSendMessagesRequest: ({ body, messages: msgs, id: requestChatId }) => ({
      body: {
        messages: msgs,
        id: requestChatId,
        ...(body as Record<string, unknown>),
        surface,
        context: getContext(),
      },
    }),
  })
}
