# Production seed (Neon)

One-time bootstrap for home blocks, collections, products, and look-elise routes on production Postgres.

## Prerequisites

- `DATABASE_URL` / `DATABASE_URL` points at Neon (Vercel env)
- Migrations have run (`payload migrate` on deploy)

## Environment

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `SEED_SECRET` | yes (for `/api/seed`) | — | Bearer token; route returns **503** if unset |
| `SEED_SKIP_HOME_IF_PUBLISHED` | no | `true` | Skip overwriting a published home Page |
| `SEED_FORCE_HOME` | no | `false` | Set `1` to force home block sync |

## Option A — CLI (recommended)

From repo root, with prod `DATABASE_URL` in env:

```bash
pnpm --filter web seed
```

Re-run is safe (idempotent). Home is not overwritten when already published unless `SEED_FORCE_HOME=1`.

## Option B — HTTP (Vercel)

1. Generate a secret: `openssl rand -hex 32`
2. Add `SEED_SECRET` in Vercel → Environment Variables → redeploy
3. Run once:

```bash
curl -X POST \
  -H "Authorization: Bearer $SEED_SECRET" \
  https://www.lenue.paris/api/seed
```

Without `SEED_SECRET` on the server, `/api/seed` returns **503** (disabled). Wrong token returns **401**.

## After seed

- `/fr` — published home Page with blocks
- `/fr/collections/{slug}` — curated collections
- `/fr/produits/look-elise-edition-limitee` — look gallery (unblocks `look_elise_gallery` maison scoring)

Do not expose `/api/seed` without `SEED_SECRET`; never commit the secret.
