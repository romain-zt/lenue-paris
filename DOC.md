# RAG — mise en place, tests et résultats attendus

Recherche sémantique sur le **contenu CMS** (pages, blocs, produits, collections, médias, paramètres, design tokens). L’assistant IA dans `/admin` s’appuie sur l’outil `semantic_search` pour répondre avec des données réelles — pas depuis sa mémoire d’entraînement.

---

## Ce que fait le RAG

```
Payload CMS (save/delete)
        ↓ hooks automatiques
indexDocument / indexGlobal  →  table content_chunks (pgvector, 1536 dims)
        ↓
semantic_search (outil IA)  →  /api/ai/chat  →  panneau admin + FAB site
```

**Indexé :** `pages`, `products`, `collections`, `media`, `site-settings`, `design-tokens`  
**Pas indexé :** HTML rendu, code React, fichiers statiques hors CMS

---

## 1. Mise en place (checklist)

### Étape 1 — Prérequis `.env`

Copier `.env.example` → `.env` à la **racine** du monorepo.

| Variable | Valeur attendue | Obligatoire |
|----------|-----------------|-------------|
| `DATABASE_URL` | `postgres://lenueparis:lenueparis@localhost:5433/lenueparis` | oui |
| `PAYLOAD_SECRET` | chaîne aléatoire longue | oui |
| `OPENAI_API_KEY` | clé OpenAI valide | oui (RAG + chat) |
| `AI_EMBEDDING_MODEL` | `text-embedding-3-small` (défaut) | non |


### Étape 2 — Docker

```powershell
cd C:\Users\khrai\Desktop\boulot\2026\lenue-paris
docker compose up -d
```

**Résultat attendu :** containers `lenueparis-postgres` et `lenueparis-minio` **Running / Healthy**.

### Étape 3 — Dépendances + base

```powershell
pnpm install
pnpm migrate
```

**Résultat attendu migrate :**

```text
[INFO] Done.
```

(pas d’erreur — la migration `content_chunks` + extension `vector` est appliquée)

### Étape 4 — Contenu de démo

```powershell
pnpm seed
```

**Résultat attendu :** `🎉 Seed complete` avec produits, pages (livraison, contact, à-propos…), site settings.

### Étape 5 — Indexation vectorielle (indispensable)

```powershell
pnpm --filter web reindex-content
```

**Résultat attendu (succès) :**

```text
[reindex-content] Done — 435 chunks across 41 documents
```

(les chiffres peuvent varier légèrement selon le seed, mais doivent être > 0)

**Échec :**

```text
[reindex-content] Skipped: OPENAI_API_KEY not set
```

→ `OPENAI_API_KEY` absent ou vide dans `.env`.

### Étape 6 — Lancer l’app

```powershell
pnpm dev
```

**Résultat attendu :**

```text
web:dev:  - Local:  http://localhost:3001
web:dev:  ✓ Ready
```

| URL | Usage |
|-----|--------|
| http://localhost:3001 | Storefront |
| http://localhost:3001/admin | Admin + panneau IA |

**Login admin :** `admin@lenue.paris` / `lenue2026`

> Utiliser **port 3001** uniquement. Ne pas aller sur `localhost:3000` (ancien CMS désactivé).

---

## 2. Tester que le RAG est en marche

### Test A — Intégration automatique (recommandé en premier)

```powershell
pnpm test:rag
```

**Résultat attendu (succès) :**

```text
[test-rag] Vérification de la recherche sémantique…

→ "livraison"
  [1.000] pages/5 · slug
      livraison
  [0.927] pages/5 · title
      Livraison
  [0.445] pages/5 · body
      Chaque robe Lénue est préparée avec soin, en petites séries…

→ "robes en soie"
  [0.561] collections/2 · slug
      robes-signature
  [0.556] products/4 · description
      Silhouette colonne en soie-coton sauge…
  …

→ "couleur accent du site"
  [0.558] design-tokens/design-tokens · colorAccent
      colorAccent: #1c1917
  …

[test-rag] OK — 9 passage(s) retourné(s) sur 3 requêtes
```

**Échecs possibles :**

| Sortie | Action |
|--------|--------|
| `OPENAI_API_KEY manquant` | Renseigner `.env`, relancer |
| `(aucun résultat)` sur toutes les requêtes | `pnpm --filter web reindex-content` |

### Test B — Vérification base de données

```powershell
docker exec lenueparis-postgres psql -U lenueparis -d lenueparis -c "SELECT COUNT(*) FROM content_chunks WHERE embedding IS NOT NULL;"
```

**Résultat attendu :**

```text
 count
-------
   435
(1 row)
```

(count > 0 — typiquement ~400+ après seed complet)

```powershell
docker exec lenueparis-postgres psql -U lenueparis -d lenueparis -c "SELECT collection, COUNT(*) FROM content_chunks GROUP BY collection ORDER BY collection;"
```

**Résultat attendu :** lignes pour `pages`, `products`, `collections`, `media`, `site-settings`, `design-tokens`.

### Test C — Tests unitaires (offline, sans OpenAI)

```powershell
pnpm --filter @repo/cms-data test
```

**Résultat attendu :**

```text
Test Files  8 passed (8)
     Tests  34 passed (34)
```

### Test D — Panneau IA admin (test manuel)

1. Ouvrir http://localhost:3001/admin/collections/pages/5 (page **Livraison**)
2. Ouvrir le panneau IA (onglet **Contenu**)
3. Envoyer :

   > Où parle-t-on de la livraison sur le site ?

**Résultat attendu (validé) :**

- Sur un document **déjà ouvert** (`pages/5`), le snapshot est injecté côté serveur — la carte « Recherche sémantique » peut ne **pas** apparaître (normal)
- Réponse factuelle structurée, par exemple :

  > On parle de la livraison principalement sur la page intitulée "Livraison". Voici un extrait de son contenu :
  >
  > - **Titre** : Livraison
  > - **Corps** : Chaque robe Lénue est préparée avec soin, en petites séries. Nous expédions depuis la France vers l'Europe et au-delà. Après votre sélection, nous finalisons la commande avec vous sur WhatsApp : taille, adresse et délai vous sont confirmés en personne. Les frais et délais dépendent de votre pays de livraison — nous vous les précisons avant validation, sans surprise.

- **Pas** de demande d’ID, d’URL ou « je n’ai pas accès »
- Le texte du **Corps** correspond au champ `body` de `pages/5` et à `pnpm test:rag` → `pages/5 · body`

**Log serveur attendu** (terminal `pnpm dev`) :

```text
[ai/chat] { tab: 'contenu', contextType: 'collection', hasUser: true, … }
```

`contextType: 'collection'` confirme que tu es bien sur un document (pages/5).

### Test E — Réindex automatique (hook)

1. Admin → Pages → Livraison → modifier un texte (ex. ajouter `test-rag-xyz` dans le body)
2. Sauvegarder
3. Vérifier :

```powershell
docker exec lenueparis-postgres psql -U lenueparis -d lenueparis -c "SELECT text FROM content_chunks WHERE text ILIKE '%test-rag-xyz%' LIMIT 3;"
```

**Résultat attendu :** au moins 1 ligne avec le nouveau texte.

---

## 3. Prompts à tester dans `/admin`

### Recherche RAG (depuis n’importe où dans l’admin)

| Prompt | Résultat attendu |
|--------|------------------|
| *Où parle-t-on de la livraison sur le site ?* | Page Livraison, texte sur expédition France/Europe |
| *Quelles robes sont en soie ?* | Produits/collections mentionnant soie (ex. Robe Héloïse, collection robes-signature) |
| *Quelle est la couleur accent du site ?* | `#1c1917` (design-tokens · colorAccent) |
| *Combien de produits publiés sont en stock ?* | Comptage via `search_content` |
| *Quels sont les paramètres de la marque ?* | site-settings (nom, Instagram, WhatsApp) |

### Sur un document ouvert (`/admin/collections/pages/<id>`)

| Prompt | Résultat attendu |
|--------|------------------|
| *Résume ce document* | Résumé sans demander d’ID |
| *Explique-moi les champs de ce document* | Liste des champs Payload |
| *Traduis ce document en EN et RU* | Traductions proposées ou appliquées via `patch_field` |

### Dashboard `/admin` seul (sans document ouvert)

| Prompt | Résultat attendu |
|--------|------------------|
| *Résume cette page* | Vue d’ensemble du site via `get_site_snapshot` (compteurs, marque) — **pas** une page storefront |

### Ce qu’il ne faut pas faire

- Coller une URL (`http://localhost:3001/...`) — l’IA n’a pas accès au navigateur
- Demander « résume cette page » depuis `/admin` seul en pensant parler de la page Livraison → ouvrir d’abord le document

---

## 4. Comment savoir si le RAG est OK (récap)

| Niveau | Commande / action | OK si… |
|--------|-------------------|--------|
| Index | `pnpm --filter web reindex-content` | `Done — N chunks` (N > 0) |
| DB | `COUNT(*) … embedding IS NOT NULL` | > 0 (ex. 435) |
| Intégration | `pnpm test:rag` | `OK — 9 passage(s)…` |
| Unitaires | `pnpm --filter @repo/cms-data test` | 34 passed |
| Chat admin | *Où parle-t-on de la livraison ?* | Réponse factuelle pages/5, pas d’invention |

**Si les 4 premiers passent**, l’infra RAG est opérationnelle. Le test chat valide la chaîne complète jusqu’à l’utilisateur.

---

## 5. Réindex

| Situation | Commande |
|-----------|----------|
| Premier setup | `pnpm --filter web reindex-content` |
| Index vide / nouveau clone | idem |
| Après modification d’un document | automatique (hooks Payload au save) |
| Changement majeur de contenu | relancer `reindex-content` |

---

## 6. Dépannage

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| `Skipped: OPENAI_API_KEY not set` | Clé absente | Renseigner `.env`, relancer reindex |
| `pnpm test:rag` → aucun résultat | Index vide | `pnpm --filter web reindex-content` |
| `missing secret key` au dev | `.env` non chargé | `pnpm dev` depuis la racine |
| IA demande un ID / URL | Mauvais contexte | Ouvrir le document dans l’admin |
| `/admin` 404 | Ancienne config | Utiliser http://localhost:3001/admin |

---

## 7. Commandes rapides

```powershell
# Setup complet (première fois)
docker compose up -d
pnpm install
pnpm migrate
pnpm seed
pnpm --filter web reindex-content

# Vérifier
pnpm test:rag
pnpm --filter @repo/cms-data test

# Dev
pnpm dev
# → http://localhost:3001/admin  (admin@lenue.paris / lenue2026)
```
