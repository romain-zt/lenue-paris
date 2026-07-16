import type { UIMessage } from 'ai'

export type TriageCategory = 'Contenu' | 'Développement' | 'Ambigu'
export type RequestIntent = 'contenu' | 'developpement'

export interface TriageInfo {
  category: TriageCategory
  todo: string
  requires: string
}

export interface TriageContext {
  type?: 'collection' | 'collection-list' | 'global' | 'dashboard'
  collection?: string
  id?: string
  slug?: string
}

/** Response header carrying server-side triage JSON (fallback for the UI badge). */
export const AI_TRIAGE_HEADER = 'X-AI-Triage'

const TRIAGE_BLOCK_RE =
  /\*\*Catégorie\*\*\s*:\s*(Contenu|Développement|Ambigu)\s*\n\*\*À faire\*\*\s*:\s*([^\n]+)\s*\n\*\*Ce que ça demande\*\*\s*:\s*([^\n]+)/

export function formatTriageBlock(triage: TriageInfo): string {
  return `**Catégorie** : ${triage.category}\n**À faire** : ${triage.todo}\n**Ce que ça demande** : ${triage.requires}`
}

export function parseTriageBlock(text: string): TriageInfo | null {
  const match = TRIAGE_BLOCK_RE.exec(text)
  if (!match) return null
  const category = match[1]
  const todo = match[2]?.trim()
  const requires = match[3]?.trim()
  if (!category || !todo || !requires) return null
  return {
    category: category as TriageCategory,
    todo,
    requires,
  }
}

export function parseTriageHeader(headerValue: string | null): TriageInfo | null {
  if (!headerValue) return null
  try {
    const jsonText = headerValue.startsWith('{')
      ? headerValue
      : decodeBase64Utf8(headerValue.trim())
    const parsed: unknown = JSON.parse(jsonText)
    if (
      typeof parsed === 'object'
      && parsed !== null
      && 'category' in parsed
      && 'todo' in parsed
      && 'requires' in parsed
    ) {
      const record = parsed as Record<string, unknown>
      const category = record.category
      const todo = record.todo
      const requires = record.requires
      if (
        (category === 'Contenu' || category === 'Développement' || category === 'Ambigu')
        && typeof todo === 'string'
        && typeof requires === 'string'
        && todo.length > 0
        && requires.length > 0
      ) {
        return { category, todo, requires }
      }
    }
  } catch {
    return null
  }
  return null
}

/** ASCII-safe HTTP header value (Unicode triage JSON → base64). */
export function serializeTriageHeader(triage: TriageInfo): string {
  return encodeBase64Utf8(JSON.stringify(triage))
}

function encodeBase64Utf8(text: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text, 'utf8').toString('base64')
  }
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function decodeBase64Utf8(base64: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf8')
  }
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Split assistant text into triage badge data + remaining prose. */
export function splitTriageFromMessage(text: string): {
  triage: TriageInfo | null
  body: string
} {
  const triage = parseTriageBlock(text)
  if (!triage) return { triage: null, body: text }
  const body = text.replace(TRIAGE_BLOCK_RE, '').trim()
  return { triage, body }
}

const DEV_INTENT_PATTERNS: RegExp[] = [
  /\b(bloc|block)\s+payload/i,
  /\bcomposant\s+react/i,
  /\broute\s+api/i,
  /\bmigration\b/i,
  /\bsch[ée]ma\b/i,
  /\bcode\s+source\b/i,
  /\bfichier(s)?\s+(et\s+)?(les\s+)?lignes?/i,
  /\bnum[ée]ros?\s+de\s+ligne/i,
  /\bpackages\/|apps\/web\/src/i,
  /\bpayload-schema/i,
  /\btypescript\b/i,
  /\bo[uù]\s+est\s+(d[ée]fini|la\s+logique|le\s+code|g[ée]r[ée])/i,
  /\bo[uù]\s+se\s+trouve\s+la\s+logique/i,
  /\bcr[ée]er\s+un\s+(nouveau\s+)?bloc/i,
  /\bstructure\s+(du\s+site|payload)/i,
  /\bcollection\s+users\b/i,
  /\bs3storage\b/i,
  /\breindex-code\b/i,
  /\bhooks?\s+payload/i,
  /\bapi\/ai\b/i,
  /\bdans\s+le\s+code\b/i,
  /\bmonorepo\b/i,
  /\bcomposant\b/i,
  /\bnext\.js\b/i,
  /\bfr\.json\b/i,
  /\bi18n\b/i,
  /\bcss\b/i,
  /\btailwind\b/i,
]

const CONTENT_PATCH_PATTERNS: RegExp[] = [
  /\b(change|changer|modifier|modifie|met(s|tre)|mets|renomme|tradui|ajoute|supprime|retire|passe|fixe|mets?\s+le|mets?\s+la)\b/i,
  /\b(titre|prix|stock|couleur|texte|description|slug)\b.*\b(en|à|sur)\b/i,
  /\bpage\s+d['']accueil\b/i,
]

const ACTION_VERB_PATTERN =
  /\b(change|changer|modifier|modifie|crée|créer|ajoute|ajouter|supprime|retire|mets|met|tradui|renomme|fixe|planifie|aide-moi)\b/i

const READ_ONLY_QUESTION_PATTERN =
  /^(où|quoi|comment|combien|liste|montre|explique|résume|donne|quel|quelle|est-ce|y a-t-il|c'est quoi|décris|affiche)/i

/** Extract plain text from a UIMessage (parts or legacy content). */
export function extractMessageText(message: UIMessage): string {
  const withParts = message as UIMessage & { parts?: { type: string; text?: string }[] }
  if (withParts.parts?.length) {
    return withParts.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
      .map(p => p.text)
      .join('\n')
      .trim()
  }
  const withContent = message as UIMessage & { content?: string }
  return typeof withContent.content === 'string' ? withContent.content.trim() : ''
}

function textLooksLikeDevIntent(text: string): boolean {
  const normalized = text.trim()
  if (!normalized) return false
  return DEV_INTENT_PATTERNS.some(pattern => pattern.test(normalized))
}

function textLooksLikeContentPatch(text: string): boolean {
  return CONTENT_PATCH_PATTERNS.some(pattern => pattern.test(text))
}

function textLooksLikeActionableRequest(text: string): boolean {
  const normalized = text.trim()
  if (!normalized) return false
  if (textLooksLikeDevIntent(normalized)) return true
  if (textLooksLikeContentPatch(normalized)) return true
  return ACTION_VERB_PATTERN.test(normalized)
}

function buildDevTriage(text: string, readOnly: boolean): TriageInfo {
  const lower = text.toLowerCase()

  if (readOnly) {
    if (/\b(bloc|block)\b/.test(lower)) {
      return {
        category: 'Développement',
        todo: 'Localiser la définition du bloc Payload et son composant React',
        requires: 'packages/payload-schema/src/blocks/, apps/web/src/components/ — via search_code',
      }
    }
    if (/\b(collection|users|media|products)\b/.test(lower)) {
      return {
        category: 'Développement',
        todo: 'Trouver la collection Payload et ses champs dans le code',
        requires: 'packages/payload-schema/src/collections/ — via search_code',
      }
    }
    if (/\b(s3|media|upload|stockage)\b/.test(lower)) {
      return {
        category: 'Développement',
        todo: 'Localiser la configuration upload / stockage médias',
        requires: 'apps/web/src/payload.config.ts, collection Media — via search_code',
      }
    }
    if (/\b(route|api|chat|ia)\b/.test(lower)) {
      return {
        category: 'Développement',
        todo: 'Localiser la route API ou la logique serveur concernée',
        requires: 'apps/web/src/app/api/ — via search_code',
      }
    }
    return {
      category: 'Développement',
      todo: 'Explorer le code source et répondre avec fichiers + lignes',
      requires: 'Monorepo (apps/web/src, packages/payload-schema, packages/cms-data) — via search_code',
    }
  }

  if (/\b(bloc|block)\b/.test(lower)) {
    return {
      category: 'Développement',
      todo: 'Planifier l\'ajout ou la modification d\'un bloc Payload + composant storefront',
      requires: 'Schéma bloc (packages/payload-schema/src/blocks/), composant React, RenderBlocks',
    }
  }
  if (/\b(migration|sch[ée]ma|champ)\b/.test(lower)) {
    return {
      category: 'Développement',
      todo: 'Modifier le schéma Payload et prévoir une migration',
      requires: 'packages/payload-schema/, migration Payload, regénération des types',
    }
  }
  if (/\b(traduction|i18n|fr\.json|messages\/)\b/.test(lower)) {
    return {
      category: 'Développement',
      todo: 'Mettre à jour les fichiers de traduction ou la logique i18n',
      requires: 'apps/web/messages/*.json ou clés next-intl — non modifiable via patch_field',
    }
  }
  return {
    category: 'Développement',
    todo: 'Produire un plan de modification code actionnable',
    requires: 'Fichiers source identifiés par search_code (chemins + lignes) — non exécutable depuis l\'assistant',
  }
}

function buildContentTriage(text: string, context?: TriageContext): TriageInfo {
  const lower = text.toLowerCase()

  if (/\bpage\s+d['']accueil\b|\baccueil\b|\bhome\b|\bhero\b|\bwordmark\b/.test(lower)) {
    return {
      category: 'Contenu',
      todo: 'Modifier le contenu visible de la page d\'accueil',
      requires: 'Global site-settings (wordmark) et/ou blocs hero de la page home — patch_field',
    }
  }
  if (/\b(prix|stock|produit|robe|catalogue)\b/.test(lower)) {
    return {
      category: 'Contenu',
      todo: 'Mettre à jour un produit du catalogue',
      requires: 'Collection products (titre, prix, stock, description) — patch_field',
    }
  }
  if (/\b(couleur|design.?token|accent|palette)\b/.test(lower)) {
    return {
      category: 'Contenu',
      todo: 'Modifier les design tokens du site',
      requires: 'Global design-tokens — patch_field isGlobal:true',
    }
  }
  if (/\b(tradui|traduction|locale|fr|en|ru)\b/.test(lower)) {
    return {
      category: 'Contenu',
      todo: 'Mettre à jour les champs localisés du contenu',
      requires: 'Champs localisés Payload (locale fr/en/ru) — patch_field avec locale',
    }
  }
  if (context?.type === 'global' && context.slug) {
    return {
      category: 'Contenu',
      todo: `Modifier le global « ${context.slug} »`,
      requires: `Global ${context.slug} — patch_field isGlobal:true`,
    }
  }
  if (context?.type === 'collection' && context.collection && context.id) {
    return {
      category: 'Contenu',
      todo: `Modifier le document ${context.collection}`,
      requires: `Collection ${context.collection} (id ${context.id}) — patch_field`,
    }
  }
  return {
    category: 'Contenu',
    todo: 'Mettre à jour le contenu CMS',
    requires: 'Document Payload (pages, products, collections, site-settings, design-tokens) — patch_field',
  }
}

/**
 * Server-side triage before the LLM runs. Returns null for simple Q&A without action.
 */
export function classifyTriage(
  messages: UIMessage[],
  context?: TriageContext,
): TriageInfo | null {
  const userText = getLastUserMessageText(messages)
  if (!userText) return null

  const isDev = textLooksLikeDevIntent(userText)
  const isContentPatch = textLooksLikeContentPatch(userText)
  const isActionable = textLooksLikeActionableRequest(userText)
  const isReadOnlyQuestion =
    READ_ONLY_QUESTION_PATTERN.test(userText.trim())
    && !isContentPatch
    && !ACTION_VERB_PATTERN.test(userText)

  if (!isActionable && isReadOnlyQuestion) return null

  if (isDev && isContentPatch) {
    return {
      category: 'Ambigu',
      todo: 'Préciser si la demande porte sur le contenu CMS ou le code source',
      requires: 'Clarification : champs Payload (Contenu) vs fichiers TypeScript/React (Développement)',
    }
  }

  if (isDev) {
    const readOnly = isReadOnlyQuestion && !isContentPatch
    return buildDevTriage(userText, readOnly)
  }

  if (isContentPatch) {
    return buildContentTriage(userText, context)
  }

  if (isActionable && context?.type === 'collection' && context.collection && context.id) {
    return buildContentTriage(userText, context)
  }

  return null
}

export function buildServerTriageNote(triage: TriageInfo | null): string {
  if (!triage) {
    return '\n\n## Triage serveur\nAucune action de modification détectée — réponds sans bloc triage.'
  }
  return `\n\n## Triage serveur (OBLIGATOIRE)\nRecopie **exactement** ce bloc en tête de réponse, caractère pour caractère, avant toute autre phrase :\n\n${formatTriageBlock(triage)}`
}

/**
 * Pick model routing from conversation without manual tabs.
 */
export function classifyRequestIntent(
  messages: UIMessage[],
  context?: TriageContext,
): RequestIntent {
  const triage = classifyTriage(messages, context)
  if (triage?.category === 'Développement') return 'developpement'
  if (triage?.category === 'Contenu') return 'contenu'

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (!message) continue
    if (message.role === 'user') {
      const text = extractMessageText(message)
      if (textLooksLikeDevIntent(text)) return 'developpement'
      break
    }
  }

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (!message || message.role !== 'assistant') continue
    const text = extractMessageText(message)
    const parsed = parseTriageBlock(text)
    if (parsed?.category === 'Développement') return 'developpement'
    if (parsed?.category === 'Contenu') return 'contenu'
  }

  return 'contenu'
}

/** True when the latest user message asks to mutate CMS content (not just read). */
export function looksLikeContentModification(messages: UIMessage[]): boolean {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (!message || message.role !== 'user') continue
    const text = extractMessageText(message)
    if (textLooksLikeDevIntent(text)) return false
    return textLooksLikeContentPatch(text)
  }
  return false
}

export function getLastUserMessageText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (!message || message.role !== 'user') continue
    return extractMessageText(message)
  }
  return ''
}

export const TRIAGE_CATEGORY_STYLES: Record<
  TriageCategory,
  { bg: string; color: string; border: string }
> = {
  Contenu: {
    bg: 'rgba(34,197,94,0.12)',
    color: '#166534',
    border: 'rgba(34,197,94,0.35)',
  },
  Développement: {
    bg: 'rgba(99,102,241,0.12)',
    color: '#3730a3',
    border: 'rgba(99,102,241,0.35)',
  },
  Ambigu: {
    bg: 'rgba(234,179,8,0.12)',
    color: '#854d0e',
    border: 'rgba(234,179,8,0.35)',
  },
}
