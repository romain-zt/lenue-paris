import { streamText, stepCountIs, convertToModelMessages, tool, zodSchema } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { type NextRequest } from 'next/server'
import type { UIMessage } from 'ai'
import { cookies } from 'next/headers'
import config from '@payload-config'
import {
  setPayloadConfig,
  getCmsClient,
  getDocument,
  buildDocumentSnapshot,
  searchContent,
  getSiteSnapshot,
  getSchemaManifest,
  formatSchemaManifest,
  patchDocument,
  parseContentLocale,
} from '@repo/cms-data'
import { semanticSearch } from '@repo/cms-data/indexing'

setPayloadConfig(config)

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
})

function resolveModel(tab: 'contenu' | 'developpement' | undefined) {
  if (tab === 'developpement') {
    return openai(process.env.AI_MODEL_DEV ?? 'gpt-4o')
  }
  return openai(process.env.AI_MODEL_CONTENU ?? 'gpt-4o-mini')
}

const SYSTEM_PROMPT = `Tu es l'assistant IA intégré dans le panel d'administration du site.

Tu parles français par défaut et tu t'adaptes à la langue de l'utilisateur si nécessaire.

Tu peux lire et modifier le contenu du site directement via les outils disponibles. Quand on te demande de modifier quelque chose, fais-le immédiatement sans demander de confirmation, sauf si c'est irréversible ou ambigu.

## Règles de récupération (obligatoires)
- Avant toute réponse factuelle sur le contenu (prix, stock, titres, couleurs de design tokens), appelle semantic_search (recherche sémantique) ou search_content (recherche exacte) ou get_site_snapshot — ne réponds jamais depuis ta mémoire d'entraînement
- Préfère semantic_search pour les questions en langage naturel (« où parle-t-on de la livraison ? », « quels produits évoquent la soie ? »)
- Utilise search_content pour les filtres structurés (catégorie, stock, statut) ou les correspondances exactes
- Pour connaître la structure des champs, appelle get_schema — jamais de supposition sur les noms de champs
- Utilise get_document pour lire un document complet avant de le modifier si besoin
- Utilise patch_field pour mettre à jour des champs (collections modifiables : pages, products, collections ; globaux : site-settings, design-tokens)
- Pour les globaux, utilise isGlobal: true
- Pour les champs localisés, précise toujours la locale (fr, en, ou ru)
- Après chaque modification réussie, confirme en une phrase ce qui a changé
- Si les outils ne retournent pas l'information, dis explicitement que tu ne la trouves pas dans la base
- Sois concis et direct`

async function resolvePayloadUserId(request: NextRequest): Promise<number | undefined> {
  try {
    const payload = await getCmsClient()
    const { user } = await payload.auth({ headers: request.headers })
    if (!user?.id) return undefined
    return typeof user.id === 'number' ? user.id : parseInt(String(user.id), 10)
  } catch {
    return undefined
  }
}

export async function POST(request: NextRequest) {
  let body: {
    messages: UIMessage[]
    tab?: 'contenu' | 'developpement'
    context?: {
      type: 'collection' | 'global' | 'dashboard'
      collection?: string
      id?: string
      slug?: string
      locale?: string
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

  const { messages, tab, context } = body

  if (!process.env.OPENAI_API_KEY) {
    console.error('[/api/ai/chat] OPENAI_API_KEY is not set — AI responses will fail')
  }

  const cookieStore = await cookies()
  const payloadToken = cookieStore.get('payload-token')?.value
  const editorToken = cookieStore.get('editor_token')?.value
  const isAuthorized =
    !!payloadToken ||
    (!!editorToken && editorToken === process.env.EDITOR_SHARE_TOKEN)

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const userId = await resolvePayloadUserId(request)
  const snapshotLocale = parseContentLocale(context?.locale)

  let docSnapshot = ''
  if (context?.type === 'collection' && context.collection && context.id) {
    const doc = await getDocument({
      collection: context.collection,
      id: context.id,
      locale: snapshotLocale,
      depth: 1,
    })
    if (!('error' in doc)) {
      docSnapshot = buildDocumentSnapshot(
        doc,
        `collection="${context.collection}", id="${context.id}"`,
        context.collection as 'pages' | 'products' | 'collections' | 'media',
      )
      docSnapshot += `\n\nRègle critique : pour modifier le titre, utilisez patch_field avec data={"title":"…"} — jamais "data.title" ni un chemin imbriqué inventé.`
    }
  } else if (context?.type === 'global' && context.slug) {
    const doc = await getDocument({
      collection: context.slug,
      isGlobal: true,
      locale: snapshotLocale,
      depth: 1,
    })
    if (!('error' in doc)) {
      docSnapshot = buildDocumentSnapshot(
        doc,
        `global="${context.slug}"`,
        context.slug as 'site-settings' | 'design-tokens',
      )
    }
  }

  const contextNote = context?.type === 'collection' && context.collection && context.id
    ? `\n\n## Contexte actuel\nL'utilisateur édite le document : collection="${context.collection}", id="${context.id}", locale="${snapshotLocale}". Utilise ce document par défaut.${docSnapshot}`
    : context?.type === 'global' && context.slug
      ? `\n\n## Contexte actuel\nL'utilisateur est sur le global : "${context.slug}", locale="${snapshotLocale}". Utilise ce global par défaut (isGlobal: true).${docSnapshot}`
      : ''

  const modelMessages = await convertToModelMessages(messages)
  const resolvedTab = tab ?? 'contenu'
  const model = resolveModel(resolvedTab)
  const logStart = Date.now()

  try {
    const result = streamText({
      model,
      system: SYSTEM_PROMPT + contextNote,
      messages: modelMessages,
      stopWhen: stepCountIs(8),
      tools: {
        get_document: tool({
          description: 'Lire un document depuis la base de contenu',
          inputSchema: zodSchema(z.object({
            collection: z.string().describe('Slug de la collection ou du global (site-settings, design-tokens)'),
            id: z.string().optional().describe('ID du document (non requis pour les globaux)'),
            locale: z.string().optional().describe('Locale: fr, en ou ru'),
            isGlobal: z.boolean().optional().describe("Vrai si c'est un global"),
          })),
          execute: async ({ collection, id, locale, isGlobal }) =>
            getDocument({
              collection,
              id,
              locale: parseContentLocale(locale),
              isGlobal,
              depth: 1,
            }),
        }),

        patch_field: tool({
          description: 'Modifier des champs dans un document (pages, products, collections, site-settings, design-tokens uniquement)',
          inputSchema: zodSchema(z.object({
            collection: z.string().describe('Slug de la collection ou du global'),
            id: z.string().optional().describe('ID du document (non requis pour les globaux)'),
            data: z.record(z.string(), z.unknown()).describe('Objet avec les champs à mettre à jour'),
            locale: z.string().optional().describe('Locale pour les champs localisés (fr, en, ru)'),
            isGlobal: z.boolean().optional().describe('Vrai pour modifier un global'),
          })),
          execute: async ({ collection, id, data, locale, isGlobal }) =>
            patchDocument({
              collection,
              id,
              data,
              locale: parseContentLocale(locale),
              isGlobal,
              userId,
            }),
        }),

        get_schema: tool({
          description: 'Retourne la structure actuelle des collections et globaux (noms de champs, types, localisation)',
          inputSchema: zodSchema(z.object({})),
          execute: async () => {
            const manifest = getSchemaManifest()
            return {
              manifest,
              formatted: formatSchemaManifest(manifest),
            }
          },
        }),

        search_content: tool({
          description: 'Rechercher du contenu dans la base (produits, pages avec blocs, collections, médias). Utilise des filtres pour compter (ex: category=dresses, inStock=true, status=published).',
          inputSchema: zodSchema(z.object({
            query: z.string().optional().describe('Texte à rechercher dans titre, slug, description, blocs de page ou alt média'),
            collections: z.array(z.enum(['products', 'pages', 'collections', 'media'])).optional(),
            locale: z.string().optional().describe('Locale: fr, en ou ru'),
            category: z.string().optional().describe('Filtre catégorie produit: dresses, bags, scarfs'),
            inStock: z.boolean().optional().describe('Filtre stock produit'),
            status: z.enum(['published', 'draft']).optional().describe('Filtre statut de publication'),
            limit: z.number().optional().describe('Nombre max de résultats par collection (défaut 20)'),
          })),
          execute: async ({ query, collections, locale, category, inStock, status, limit }) =>
            searchContent({
              query,
              collections,
              locale: parseContentLocale(locale),
              filters: { category, inStock, status },
              limit,
            }),
        }),

        semantic_search: tool({
          description: 'Recherche sémantique vectorielle dans tout le contenu du site (pages, blocs, produits, collections, médias, paramètres). Idéal pour les questions en langage naturel.',
          inputSchema: zodSchema(z.object({
            query: z.string().describe('Question ou phrase à rechercher par similarité sémantique'),
            collections: z.array(z.enum(['products', 'pages', 'collections', 'media', 'site-settings', 'design-tokens'])).optional(),
            locale: z.string().optional().describe('Locale: fr, en ou ru'),
            limit: z.number().optional().describe('Nombre max de passages retournés (défaut 10)'),
          })),
          execute: async ({ query, collections, locale, limit }) =>
            semanticSearch({
              query,
              collections,
              locale: parseContentLocale(locale),
              limit,
            }),
        }),

        get_site_snapshot: tool({
          description: 'Instantané des paramètres du site (site-settings, design-tokens) et compteurs de contenu',
          inputSchema: zodSchema(z.object({
            locale: z.string().optional().describe('Locale: fr, en ou ru'),
          })),
          execute: async ({ locale }) =>
            getSiteSnapshot(parseContentLocale(locale)),
        }),
      },
    })

    console.log('[ai/chat]', {
      tab: resolvedTab,
      model: resolvedTab === 'developpement'
        ? (process.env.AI_MODEL_DEV ?? 'gpt-4o')
        : (process.env.AI_MODEL_CONTENU ?? 'gpt-4o-mini'),
      contextType: context?.type,
      hasUser: !!userId,
      latencyMs: Date.now() - logStart,
    })
    return result.toUIMessageStreamResponse()
  } catch (err) {
    console.error('[ai/chat]', {
      tab: resolvedTab,
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - logStart,
    })
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur interne du serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
