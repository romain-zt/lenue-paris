# New site bootstrap

One codebase, one Neon database, one S3 bucket **per site**. A new brand is a new Vercel project with fresh env vars and a parameterised seed — no code fork.

## Model

| Layer | Per site? | Where identity lives |
|-------|-----------|----------------------|
| Code (`apps/web`, `packages/*`) | Shared | — |
| Postgres (Neon) | Separate DB per deployment | Collection rows + globals |
| S3 bucket | Separate | Media uploads |
| Env vars | Separate | Vercel project settings |

There is no `sites` collection and no row-level multi-tenancy. Duplication = deploy same repo with different env + seed.

## Prerequisites

- Neon project (empty) or branch
- S3 bucket + credentials
- Vercel project(s) from this repo

## Step 1 — Environment variables

Set these on the Vercel project (and locally in `.env`):

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URI` | yes | `postgresql://…` | Neon connection |
| `PAYLOAD_SECRET` | yes | random 32+ chars | Payload auth |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://shop.example.com` | OG URLs, preview links |
| `NEXT_PUBLIC_BRAND_NAME` | yes | `Maison Example` | Fallback before CMS globals load |
| `NEXT_PUBLIC_BRAND_SLUG` | yes | `maison-example` | localStorage key prefix (selection pill) |
| `NEXT_PUBLIC_BRAND_WORDMARK_PRIMARY` | no | `MAISON` | Header wordmark line 1 (CMS overrides) |
| `NEXT_PUBLIC_BRAND_WORDMARK_SECONDARY` | no | `EXAMPLE` | Header wordmark line 2 |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | no | `33612345678` | Footer + order CTA |
| `NEXT_PUBLIC_INSTAGRAM_URL` | no | `https://instagram.com/…` | Footer + contact |
| `S3_BUCKET`, `S3_*` | yes (prod) | — | Media storage |
| `PREVIEW_SECRET` | yes | random | Draft preview |
| `SEED_SECRET` | yes (HTTP seed) | random | `/api/seed` bearer |
| `OPENAI_API_KEY` | no | — | AI assistant |

## Step 2 — Schema bootstrap

Deploy once (or run locally):

```bash
pnpm --filter web migrate
```

Runs migrations 001–010 against the empty DB. No manual SQL.

## Step 3 — Content bootstrap (parameterised seed)

Brand fixtures live in `packages/cms-data/fixtures/brands/`. Each JSON defines `brandName`, wordmarks, social links, and admin credentials.

```bash
# Default — lenue fixture (existing production content)
pnpm --filter web seed

# New site — template fixture
pnpm --filter web seed -- --brand=template
```

To add a custom brand, copy `template.json` → `my-brand.json`, edit values, then:

```bash
pnpm --filter web seed -- --brand=my-brand
```

The seed is idempotent: re-run safely. Home page is not overwritten when already published unless `SEED_FORCE_HOME=1`.

### Custom fixture fields

```json
{
  "slug": "my-brand",
  "brandName": "Maison Example",
  "brandWordmarkPrimary": "MAISON",
  "brandWordmarkSecondary": "EXAMPLE",
  "instagramUrl": "https://www.instagram.com/example",
  "whatsappPhone": "33612345678",
  "adminEmail": "admin@example.com",
  "adminPassword": "changeme2026",
  "adminName": "Site Admin"
}
```

## Step 4 — Admin configuration (no deploy)

After seed, open `/admin` and verify:

1. **Site Settings** — `brandName`, wordmarks, Instagram, WhatsApp
2. **Design Tokens** — colour palette (updates storefront via `TokenInjector` on hard refresh)
3. **Pages / Products** — translate field-level content per locale in CMS

## Step 5 — Locale check

Locales are defined once in `@repo/payload-schema/i18n/content-locales.ts`. To add a locale:

1. Append code to `CONTENT_LOCALES`
2. Run `payload migrate:create` (extends Postgres `_locales` enum)
3. Run `pnpm --filter web check:locales -- --scaffold` (creates `messages/{locale}.json`)

No other source edits required for CMS editorial content.

## Step 6 — Smoke test

- [ ] Home header shows wordmark from Site Settings
- [ ] Page `<title>` uses `brandName` from DB
- [ ] Design token change in admin updates `text-primary` without redeploy
- [ ] WhatsApp footer link uses `site-settings.whatsappPhone`
- [ ] AI assistant returns WhatsApp number from test DB
- [ ] Selection pill uses separate localStorage per `NEXT_PUBLIC_BRAND_SLUG`

## What must never be forked per site

- `packages/payload-schema`, `packages/cms-data`
- `apps/web/src/components/**`
- `apps/web/messages/**` (system UI chrome only — editorial copy is in CMS)

Site identity lives in **Site Settings**, **Design Tokens**, and collection/global document rows.

## HTTP seed (production)

See [prod-seed.md](./prod-seed.md). Pass brand via env before calling:

```bash
SEED_BRAND=template curl -X POST \
  -H "Authorization: Bearer $SEED_SECRET" \
  https://shop.example.com/api/seed
```

(If `/api/seed` does not yet read `SEED_BRAND`, use CLI seed from a machine with prod `DATABASE_URI`.)
