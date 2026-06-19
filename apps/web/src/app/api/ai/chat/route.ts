import { streamText, stepCountIs, convertToModelMessages, tool, zodSchema } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { type NextRequest } from 'next/server'
import type { UIMessage } from 'ai'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

const cursor = createOpenAI({
  apiKey: process.env.CURSOR_API_KEY ?? '',
  baseURL: process.env.CURSOR_API_BASE_URL ?? 'https://api.cursor.sh/v1',
})

const SCHEMA_SUMMARY = `
## Collections disponibles

### pages
- slug (text, required) — identifiant URL unique
- title (text, localisé)
- body (richtext, localisé)
- seo (group)

### collections (capsules/éditions)
- title (text, localisé, required)
- slug (text, required)
- hero (upload → media)
- products (relationship → products)
- description (richtext, localisé)

### products
- title (text, localisé, required)
- slug (text, required)
- category (select)
- price (number, required)
- description (richtext, localisé)
- images (upload → media, multiple)
- sizes (array)
- _status (draft/published)

### orders
- customer (group: name, email, phone)
- items (array: product, quantity, size, price)
- status (select: pending / confirmed / shipped / cancelled)
- total (number)

### media
- alt (text, localisé)
- filename (text)

### users
- email, name, role

## Globals

### site-settings
- brandName (text, required) — nom affiché dans le header
- instagramUrl (text) — URL complète Instagram
- whatsappPhone (text) — format international sans + ni espaces, ex: 33612345678
`

const SYSTEM_PROMPT = `Tu es l'assistant IA intégré dans le panel d'administration de lenue.paris, une marque de mode parisienne.

Tu parles français par défaut et tu t'adaptes à la langue de l'utilisateur si nécessaire.

Tu peux lire et modifier le contenu du site directement via les outils disponibles. Quand on te demande de modifier quelque chose, fais-le immédiatement sans demander de confirmation, sauf si c'est irréversible ou ambigu.

${SCHEMA_SUMMARY}

## Règles
- Utilise get_document pour lire un document avant de le modifier si besoin
- Utilise patch_field pour mettre à jour des champs
- Pour les globaux (ex: site-settings), utilise isGlobal: true
- Après chaque modification réussie, confirme en une phrase ce qui a changé
- Pour les champs localisés, précise toujours la locale (fr, en, ou ru)
- Sois concis et direct`

export async function POST(request: NextRequest) {
  let body: {
    messages: UIMessage[]
    context?: {
      type: 'collection' | 'global' | 'dashboard'
      collection?: string
      id?: string
      slug?: string
    }
  }

  try {
    body = await request.json() as typeof body
  } catch (err) {
    console.error('[/api/ai/chat] Failed to parse request body:', err)
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages, context } = body
  const origin = new URL(request.url).origin

  if (!process.env.CURSOR_API_KEY) {
    console.error('[/api/ai/chat] CURSOR_API_KEY is not set — AI responses will fail')
  }

  // Read the payload-token cookie explicitly so it's forwarded to internal
  // Payload REST calls even when the request comes from the public site.
  const cookieStore = await cookies()
  const payloadToken = cookieStore.get('payload-token')?.value
  const cookie = payloadToken
    ? `payload-token=${payloadToken}`
    : (request.headers.get('cookie') ?? '')

  const contextNote = context?.type === 'collection' && context.collection && context.id
    ? `\n\n## Contexte actuel\nL'utilisateur édite le document : collection="${context.collection}", id="${context.id}". Utilise ce document par défaut.`
    : context?.type === 'global' && context.slug
      ? `\n\n## Contexte actuel\nL'utilisateur est sur le global : "${context.slug}". Utilise ce global par défaut.`
      : ''

  const modelMessages = await convertToModelMessages(messages)

  try {
    const result = streamText({
      model: cursor(process.env.CURSOR_MODEL ?? 'gpt-4o'),
      system: SYSTEM_PROMPT + contextNote,
      messages: modelMessages,
      stopWhen: stepCountIs(8),
      tools: {
      get_document: tool({
        description: 'Lire un document depuis Payload CMS',
        inputSchema: zodSchema(z.object({
          collection: z.string().describe('Slug de la collection (pages, products, collections, orders) ou du global (site-settings)'),
          id: z.string().optional().describe('ID du document (non requis pour les globaux)'),
          locale: z.string().optional().describe('Locale: fr, en ou ru'),
          isGlobal: z.boolean().optional().describe("Vrai si c'est un global (ex: site-settings)"),
        })),
        execute: async ({ collection, id, locale, isGlobal }) => {
          const params = locale ? `?locale=${locale}` : ''
          const url = isGlobal
            ? `${origin}/api/globals/${collection}${params}`
            : `${origin}/api/${collection}/${id}${params}`
          const res = await fetch(url, { headers: { cookie } })
          if (!res.ok) return { error: `HTTP ${res.status} — ${await res.text()}` }
          return res.json()
        },
      }),

      patch_field: tool({
        description: 'Modifier des champs dans un document Payload CMS',
        inputSchema: zodSchema(z.object({
          collection: z.string().describe('Slug de la collection ou du global'),
          id: z.string().optional().describe('ID du document (non requis pour les globaux)'),
          data: z.record(z.string(), z.unknown()).describe('Objet avec les champs à mettre à jour, ex: { title: "Nouveau titre" }'),
          locale: z.string().optional().describe('Locale pour les champs localisés (fr, en, ru)'),
          isGlobal: z.boolean().optional().describe('Vrai pour modifier un global'),
        })),
        execute: async ({ collection, id, data, locale, isGlobal }) => {
          const params = locale ? `?locale=${locale}` : ''
          const url = isGlobal
            ? `${origin}/api/globals/${collection}${params}`
            : `${origin}/api/${collection}/${id}${params}`
          const method = isGlobal ? 'POST' : 'PATCH'
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', cookie },
            body: JSON.stringify(data),
          })
          if (!res.ok) return { error: `HTTP ${res.status} — ${await res.text()}` }
          const result = await res.json()
          // Invalidate Next.js RSC cache so the public site reflects the change on next load
          revalidatePath('/', 'layout')
          return { success: true, updatedFields: Object.keys(data), doc: result.doc ?? result }
        },
      }),

      list_schema: tool({
        description: 'Lister toutes les collections et globaux disponibles avec leur structure de champs',
        inputSchema: zodSchema(z.object({})),
        execute: async () => ({ schema: SCHEMA_SUMMARY }),
      }),

      push_to_github: tool({
        description: 'Créer ou mettre à jour un fichier dans le dépôt GitHub (pour les composants React ou les schémas Payload)',
        inputSchema: zodSchema(z.object({
          path: z.string().describe('Chemin du fichier dans le dépôt, ex: apps/web/src/components/MyComponent.tsx'),
          content: z.string().describe('Contenu complet du fichier'),
          message: z.string().describe('Message de commit'),
        })),
        execute: async ({ path, content, message }) => {
          const token = process.env.GITHUB_TOKEN
          if (!token) return { error: 'GITHUB_TOKEN non configuré — ajoutez-le dans apps/web/.env.local' }

          const repoOwner = process.env.GITHUB_REPO_OWNER ?? 'romainpiveteau'
          const repoName = process.env.GITHUB_REPO_NAME ?? 'lenue-paris'
          const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`

          let sha: string | undefined
          const existing = await fetch(apiUrl, {
            headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'lenue-ai-panel' },
          })
          if (existing.ok) {
            const data = await existing.json()
            sha = data.sha
          }

          const putBody: Record<string, unknown> = {
            message,
            content: Buffer.from(content).toString('base64'),
          }
          if (sha) putBody.sha = sha

          const res = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'User-Agent': 'lenue-ai-panel',
            },
            body: JSON.stringify(putBody),
          })

          if (!res.ok) return { error: `GitHub API ${res.status} — ${await res.text()}` }
          return { success: true, path, message, action: sha ? 'updated' : 'created' }
        },
      }),
    },
    })
    return result.toUIMessageStreamResponse()
  } catch (err) {
    console.error('[/api/ai/chat] streamText setup error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur interne du serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
