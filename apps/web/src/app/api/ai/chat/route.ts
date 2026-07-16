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
  getCatalogSummary,
  getSchemaManifest,
  formatSchemaManifest,
  patchDocument,
  parseContentLocale,
  findHomePage,
} from '@repo/cms-data'
import { semanticSearch, searchCode } from '@repo/cms-data/indexing'
import {
  AI_TRIAGE_HEADER,
  buildServerTriageNote,
  classifyRequestIntent,
  classifyTriage,
  looksLikeContentModification,
  serializeTriageHeader,
  type RequestIntent,
  type TriageContext,
} from '@/lib/aiTriage'

setPayloadConfig(config)

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
})

function resolveModel(intent: RequestIntent, contentPatch: boolean) {
  if (intent === 'developpement') {
    return openai(process.env.AI_MODEL_DEV ?? 'gpt-4o')
  }
  if (contentPatch) {
    return openai(process.env.AI_MODEL_PATCH ?? process.env.AI_MODEL_DEV ?? 'gpt-4o')
  }
  return openai(process.env.AI_MODEL_CONTENU ?? 'gpt-4o-mini')
}

const SYSTEM_PROMPT = `Tu es l'assistant IA intégré dans le panel d'administration du site.

Tu parles français par défaut et tu t'adaptes à la langue de l'utilisateur si nécessaire.

Tu peux lire et modifier le CONTENU du site directement via les outils disponibles. Quand on te demande de modifier du contenu, fais-le immédiatement sans demander de confirmation, sauf si c'est irréversible ou ambigu.

Tu NE peux PAS modifier le code source : pour toute demande de développement, tu proposes un plan précis (« quoi faire »), sans jamais prétendre l'avoir exécuté.

L'utilisateur utilise un seul fil de conversation : tu classifies chaque demande toi-même (Contenu / Développement), sans mode manuel à choisir.

## Triage (obligatoire dès qu'une demande implique une action ou une modification)
Le bloc triage est un **préambule court** en tête de réponse — ce n'est PAS la réponse complète. Pour une modif Contenu, tu dois **enchaîner immédiatement** avec des appels d'outils dans le même échange.

**Catégorie** : Contenu | Développement | Ambigu
**À faire** : une phrase décrivant l'action
**Ce que ça demande** : les champs à modifier (Contenu) ou les fichiers/éléments à toucher (Développement)

Règles de classification :
- **Contenu** = textes, prix, stock, titres, traductions, pages, produits, collections, médias, réglages du site, design tokens (couleurs). → EXÉCUTABLE par toi via patch_field. Après le triage : cherche le document si besoin, appelle patch_field, confirme seulement si success:true. **Interdit** de dire « je vais modifier » sans avoir appelé patch_field.
- **Développement** = créer/modifier un bloc Payload, un composant React, une route API, un champ de schéma, une migration, du CSS/JS, une logique métier, la structure du site. → NON exécutable par toi. Après le triage, utilise search_code pour t'ancrer dans le vrai code, puis rends un plan : fichiers concernés (chemin + lignes), nature des changements, étapes, points d'attention. Ne modifie jamais de contenu « à la place » d'une tâche de dev.
- **Ambigu** = demande les précisions manquantes en une phrase, propose l'interprétation la plus probable.
- Pour une simple question factuelle ou une salutation, réponds normalement SANS le bloc de triage.

## Règles de développement (demandes de code)
- Avant toute affirmation sur le code, appelle search_code — ne réponds jamais sur l'architecture ou l'emplacement d'un fichier depuis ta mémoire
- Cite toujours les passages sous la forme chemin/fichier.ts (lignes X-Y)
- Reste factuel : si search_code ne retourne rien de pertinent, dis-le et propose où chercher (pathPrefix apps/web/src, packages/…)
- Le plan doit être actionnable par un développeur dans son IDE (tu n'as pas accès aux fichiers en écriture)

## Règles de récupération (obligatoires)
- Avant toute réponse factuelle sur le contenu (prix, stock, titres, couleurs de design tokens), appelle semantic_search (recherche sémantique) ou search_content (recherche exacte) ou get_site_snapshot — ne réponds jamais depuis ta mémoire d'entraînement
- Préfère semantic_search pour les questions en langage naturel (« où parle-t-on de la livraison ? », « quels produits évoquent la soie ? »)
- Utilise search_content pour les filtres structurés (catégorie, stock, statut) ou les correspondances exactes
- Pour l'inventaire catalogue (stock, robes disponibles, « combien de produits publiés ») : appelle get_catalog en premier — ne devine jamais les chiffres
- Pour connaître la structure des champs, appelle get_schema — jamais de supposition sur les noms de champs
- Utilise get_home_page pour toute question ou modification sur la page d'accueil (avant search_content)
- Utilise patch_field pour mettre à jour des champs (collections modifiables : pages, products, collections ; globaux : site-settings, design-tokens)
- Pour les globaux, utilise isGlobal: true
- Pour les champs localisés, précise toujours la locale (fr, en, ou ru)
- Après chaque modification réussie, confirme en une phrase ce qui a changé
- Si les outils ne retournent pas l'information, dis explicitement que tu ne la trouves pas dans la base
- Sois concis et direct

## Références contextuelles (« cette page », « ce document », « résume »)
- Tu n'as pas accès au navigateur : ne demande jamais d'URL, d'ID ni de lien à l'utilisateur
- Si la section « Contexte actuel » indique un document (collection + id ou global), « cette page » / « ce document » / « résume » désignent CE document : résume d'abord le snapshot fourni, ou appelle get_document avec les identifiants du contexte
- Si le contexte est le tableau de bord admin (/admin sans document ouvert), « cette page » désigne le dashboard : appelle get_site_snapshot et résume l'état du site (marque, compteurs, contenu publié)
- Ne réponds jamais « j'ai besoin de l'ID » quand le contexte ou le snapshot contient déjà le document

## Page d'accueil — champs visibles vs admin (CRITIQUE)
Sur le storefront (/), le visiteur ne voit PAS le champ Payload \`pages.title\` :
- **Grand titre hero** = global \`site-settings\` : **deux lignes** si \`brandWordmarkSecondary\` est non vide
  - Ligne 1 (grande) = \`brandWordmarkPrimary\` (ex. LÉNUE)
  - Ligne 2 (petite) = \`brandWordmarkSecondary\` (ex. PARIS) — **reste affichée** si tu ne la vides pas
- **Sous-titre hero** = bloc hero \`blocks[N].tagline\` sur la page home (patch_field collection pages + id)
- **Saison hero** = \`blocks[N].season\`
- **\`pages.title\`** = libellé admin dans le CMS uniquement — ne change pas le hero ni l'onglet navigateur (l'onglet utilise brandName)

Quand l'utilisateur dit « titre de la page d'accueil » / « changer le titre » sans précision :
1. **Un seul mot/titre** (ex. « Test », « Bienvenue ») → \`patch_field\` site-settings isGlobal:true data={brandWordmarkPrimary:"Test", brandWordmarkSecondary:""} — **les deux champs** pour ne pas laisser PARIS en dessous
2. **Deux lignes explicites** (ex. « LÉNUE PARIS », « Foo / Bar ») → répartir sur primary + secondary
3. S'il veut le **sous-titre** (phrase sous le wordmark) → \`blocks[N].tagline\` du hero (utilise get_home_page pour N)
4. Ne modifie \`pages.title\` que s'il parle explicitement du **nom du document dans l'admin**

Après patch wordmark, lis \`visibleOnStorefront.heroWordmark.renderedAs\` via get_home_page pour confirmer le rendu final.

## Recherche par nom (produit, page, collection)
- Si l'utilisateur envoie un nom court ou flou (ex. « robe eloise », « camille », « livraison »), appelle d'abord semantic_search avec cette requête, puis search_content en complément si besoin
- Tolère les fautes d'orthographe et les accents manquants (eloise → Héloïse) via semantic_search — ne dis jamais qu'un produit n'existe sans avoir appelé un outil de recherche
- Une fois le document trouvé, utilise get_document avec collection et id retournés pour donner les détails (prix, stock, description)

## Inventaire catalogue
- get_catalog retourne les produits publiés en stock, les robes disponibles (inStockDresses) et les compteurs par catégorie
- Ne dis jamais qu'il n'y a aucun produit en stock sans avoir appelé get_catalog ou search_content avec status=published et inStock=true`

const CONTENT_EXECUTION_NOTE = `

## Exécution contenu (modification demandée — OBLIGATOIRE)
Workflow dans cet échange, sans t'arrêter après le triage :
1. Document inconnu → semantic_search ou search_content pour obtenir collection + id
2. **Page d'accueil** → get_home_page d'abord. Lis \`visibleOnStorefront\` : ne patch PAS seulement pages.title si l'utilisateur veut un changement visible.
   - Gros titre visible → patch_field site-settings isGlobal:true
   - **Titre sur une seule ligne** → data={brandWordmarkPrimary:"…", brandWordmarkSecondary:""} (obligatoire pour effacer PARIS)
   - **Deux lignes** → primary + secondary
   - Sous-titre → patch_field pages id + data blocks avec le hero (index dans heroBlockIndex)
3. patch_field + locale "fr" pour les champs localisés
4. Confirmation **uniquement** si success:true — dis quel texte visible change (wordmark, tagline, etc.)

Note : le libellé « Série limitée » sur le hero d'accueil vient souvent de apps/web/messages/fr.json (clé capsuleBadge), pas d'un champ page — c'est une tâche **Développement** (fichier i18n), pas patch_field sur un bloc.

Interdit de terminer avec « je vais procéder » / « je modifie maintenant » sans patch_field exécuté. Interdit de dire « page introuvable » sans avoir appelé get_home_page ou search_content.`

const DEV_RULES_NOTE = `

## Mode développement (demande classée Développement)
Règles strictes — une violation = réponse invalide :
1. AVANT de répondre sur le code : appelle search_code (obligatoire). Pour les collections/champs Payload : appelle aussi get_schema.
2. Cite UNIQUEMENT des chemins retournés par search_code, format \`chemin/fichier.ts (lignes X-Y)\`. Jamais de chemin inventé.
3. Source de vérité du monorepo :
   - Schémas Payload : \`packages/payload-schema/src/collections/\`, \`packages/payload-schema/src/globals/\`, \`packages/payload-schema/src/blocks/\`
   - App Next.js + config Payload : \`apps/web/src/\`
   - Couche IA/RAG : \`packages/cms-data/src/\`
   - \`apps/cms/\` est LEGACY et non déployé — ne le cite JAMAIS.
4. Si search_code ne retourne rien : dis-le explicitement (« index vide ou requête trop vague ») et propose \`pnpm reindex-code\`. Interdit de donner des conseils génériques du type « cherchez dans le dossier models ».
5. Stockage médias : config S3 dans \`apps/web/src/payload.config.ts\` (plugin s3Storage), collection Media dans \`packages/payload-schema/src/collections/Media.ts\` ou \`apps/web/src/payload/media.ts\`.`

const STOREFRONT_NOTE = `

## Surface storefront (site public / lien collaborateur)
- Le triage Contenu / Développement s'applique à chaque demande actionnable.
- **Contenu** : tu peux exécuter (patch_field, édition live) — c'est le cas d'usage principal ici.
- **Développement** : appelle search_code, donne le plan (fichiers + lignes + étapes). Précise : « modification de code à faire dans l'IDE — non exécutable depuis cette interface ».
- Ne refuse pas les questions dev : réponds avec search_code même depuis le storefront.`

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
    /** @deprecated Ignored — intent is inferred from the conversation. */
    tab?: 'contenu' | 'developpement'
    surface?: 'admin' | 'storefront'
    context?: {
      type: 'collection' | 'collection-list' | 'global' | 'dashboard'
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

  const { messages, surface, context } = body

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
    ? `\n\n## Contexte actuel\nL'utilisateur édite le document : collection="${context.collection}", id="${context.id}", locale="${snapshotLocale}". « Cette page » / « ce document » / « résume » = ce document. Ne demande pas l'ID — utilise get_document ou le snapshot ci-dessous.${docSnapshot}`
    : context?.type === 'collection-list' && context.collection
      ? `\n\n## Contexte actuel\nL'utilisateur parcourt la liste de la collection "${context.collection}" (aucun document ouvert). Pour toute recherche par nom (ex. un produit), appelle semantic_search puis get_document — ne dis jamais qu'il n'existe sans avoir cherché.`
      : context?.type === 'global' && context.slug
        ? `\n\n## Contexte actuel\nL'utilisateur est sur le global : "${context.slug}", locale="${snapshotLocale}". « Ce document » / « résume » = ce global (isGlobal: true).${docSnapshot}`
        : context?.type === 'dashboard'
          ? `\n\n## Contexte actuel\nL'utilisateur est sur le tableau de bord admin (pas un document CMS ouvert). Pour toute question sur le contenu du site, appelle semantic_search ou search_content. « Cette page » / « résume » = vue d'ensemble : get_site_snapshot.`
          : ''

  const modelMessages = await convertToModelMessages(messages)
  const triageContext: TriageContext | undefined = context
    ? {
        type: context.type,
        collection: context.collection,
        id: context.id,
        slug: context.slug,
      }
    : undefined
  const serverTriage = classifyTriage(messages, triageContext)
  const resolvedIntent = classifyRequestIntent(messages, triageContext)
  const contentPatch = resolvedIntent === 'contenu' && looksLikeContentModification(messages)
  const resolvedSurface = surface ?? 'admin'
  const model = resolveModel(resolvedIntent, contentPatch)
  const logStart = Date.now()

  const surfaceNote = resolvedSurface === 'storefront' ? STOREFRONT_NOTE : ''
  const devNote = resolvedIntent === 'developpement' ? DEV_RULES_NOTE : ''
  const contentNote = contentPatch ? CONTENT_EXECUTION_NOTE : ''
  const triageNote = buildServerTriageNote(serverTriage)

  try {
    const result = streamText({
      model,
      system: SYSTEM_PROMPT + triageNote + devNote + contentNote + surfaceNote + contextNote,
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

        get_catalog: tool({
          description: 'État du catalogue produits : compteurs (publiés, en stock) et listes détaillées. Utilise pour « combien en stock », « robes disponibles », « état du catalogue ».',
          inputSchema: zodSchema(z.object({
            locale: z.string().optional().describe('Locale: fr, en ou ru'),
          })),
          execute: async ({ locale }) =>
            getCatalogSummary(parseContentLocale(locale)),
        }),

        get_home_page: tool({
          description: 'Résout la page d\'accueil (slug "home"). Retourne visibleOnStorefront avec heroWordmark.primary/secondary/renderedAs (deux lignes si secondary non vide). Pour un titre sur une ligne, patcher primary ET secondary="". PAS pages.title.',
          inputSchema: zodSchema(z.object({
            locale: z.string().optional().describe('Locale: fr, en ou ru'),
          })),
          execute: async ({ locale }) =>
            findHomePage(parseContentLocale(locale)),
        }),

        search_code: tool({
          description: 'Recherche sémantique dans le CODE SOURCE indexé (obligatoire pour toute question dev). Retourne filePath, startLine, endLine, extrait. Préfixes utiles : packages/payload-schema/src, apps/web/src, packages/cms-data/src. Ne jamais citer apps/cms.',
          inputSchema: zodSchema(z.object({
            query: z.string().describe('Requête précise (ex. « collection users Payload », « s3Storage media upload », « route chat IA »)'),
            pathPrefix: z.string().optional().describe('Filtre par préfixe (ex. packages/payload-schema/src, apps/web/src)'),
            limit: z.number().optional().describe('Nombre max de passages retournés (défaut 10)'),
          })),
          execute: async ({ query, pathPrefix, limit }) =>
            searchCode({ query, pathPrefix, limit }),
        }),
      },
    })

    console.log('[ai/chat]', {
      intent: resolvedIntent,
      triage: serverTriage?.category ?? null,
      contentPatch,
      surface: resolvedSurface,
      model: resolvedIntent === 'developpement'
        ? (process.env.AI_MODEL_DEV ?? 'gpt-4o')
        : contentPatch
          ? (process.env.AI_MODEL_PATCH ?? process.env.AI_MODEL_DEV ?? 'gpt-4o')
          : (process.env.AI_MODEL_CONTENU ?? 'gpt-4o-mini'),
      contextType: context?.type,
      hasUser: !!userId,
      latencyMs: Date.now() - logStart,
    })
    return result.toUIMessageStreamResponse({
      headers: serverTriage
        ? { [AI_TRIAGE_HEADER]: serializeTriageHeader(serverTriage) }
        : undefined,
    })
  } catch (err) {
    console.error('[ai/chat]', {
      intent: resolvedIntent,
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - logStart,
    })
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur interne du serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
