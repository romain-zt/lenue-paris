# Project Config

> The reusable `.cursor/**` workflow reads project-specific values from this file.

## Identity

- **Project name:** Lenue Paris
- **One-line product:** Luxury fashion boutique — browse dresses, bags & foulards, order via WhatsApp.
- **Domain:** lenue.paris
- **Repo root layout:** monorepo
- **Important:** Get a first home page as soon as possible in the process that the customer sees something is moving.

## Stack (overrides to `40-architecture-baseline.mdc`)

Mind to always start with the latest up-to-date release of each dependencies/framework.


| Concern    | Baseline             | This project                                        |
| ---------- | -------------------- | --------------------------------------------------- |
| Framework  | next-forge / Next.js | same                                                |
| CMS/data   | Payload (Postgres)   | same — Payload 3, deployed alongside web on Vercel  |
| Database   | Postgres             | Neon (Vercel-native serverless Postgres)            |
| Media      | S3 (MinIO local)     | AWS S3 (prod) · MinIO (local dev)                   |
| i18n       | on                   | fr (primary) + en + ru                              |
| Deployment | —                    | Vercel (monorepo: apps/web + apps/cms same project) |


## Apps (pickable — keep the monorepo, scaffold only what you need)

Setup (`05-project-setup.mdc`) scaffolds only the selected apps. See `.cursor/core/templates/starter-monorepo/apps/CATALOG.md`.

| App | Selected? | Why |
|-----|-----------|-----|
| `web` | yes | Buyer-facing storefront (browse, product detail, WhatsApp checkout). |
| `cms` | yes | Merchant edits products, pages & media in Payload; source of truth. |
| `api` | no | `web` route handlers + `cms` cover all server needs in v0. |

## Priority bands


| Band   | Feature Areas (FA-)                  |
| ------ | --------------------------------------- |
| **P0** | FA-storefront-shell; FA-product-catalog |
| **P1** | FA-product-detail; FA-whatsapp-checkout |
| **P2** | FA-cms-products; FA-editorial           |
| **P3** | FA-i18n; FA-search-filter               |
| **P4** | FA-wishlist; FA-analytics               |


Scope Slices inherit their parent Feature Area's band.

## v0 boundary (exclusions)

- Real payment processing (Stripe, etc.) — checkout is WhatsApp form submission only
- User accounts / authentication
- Cart persistence beyond session
- Inventory management / stock tracking
- Email notifications
- Multi-vendor / marketplace features
- Any surface described as "under construction" in the PRD

## Implementation phase

- **Implementation governance enabled:** yes
- **Governing decision:** PD-007-implementation-phase
- **Forbidden-paths default when locked:** `src/`**, `app/**`, `apps/**`, `packages/**`, `lib/**` (no longer a blanket ban — agents may write code through `/implement` / the phase orchestrator within v0 scope)

## Autonomous decomposition

This is the single kill-switch for unattended PRD → decomposition → implementation. It is the explicit SISO waiver (`00-siso.mdc`) and the human-approval substitute that the `/feature-area` and `/prd` workflows require before writing product scope without a human in the conversation.

- **Autonomous decomposition enabled:** yes
- **Governing decision:** PD-008-autonomous-decomposition
- **Scope of autonomy:** Feature Area map → scaffold → validate → promote → clear-for-vertical, and Scope Slice slice → scaffold-slices → refine-slice → promote-slice, then wiring `docs/state/orchestration.prd-flow-map.json`. A scope-readiness checker `CLEAR` verdict substitutes for the in-conversation human approval.
- **Still hard-stops (never bypassed):** any genuine `NEED_HUMAN` (missing product truth, unanswered open question that blocks a slice, missing secret/access, two materially different valid interpretations) — the agent sets `blocked` + `NEED_HUMAN:` and moves on.
- **Pause everything:** set this flag to `no` (and/or repo variable `ORCHESTRATOR_ENABLED=false`).

## Architectural Guardrails

These rules are **hard constraints** for all autonomous agents and human contributors. Violations must be caught in PR review or typecheck.

### 1. No inline or arbitrary CSS
- **Tailwind tokens only.** No raw `<style>` tags, no `.css` files generated at runtime, no `style={{}}` props with hardcoded px/color values.
- Exception: global `globals.css` for CSS custom properties and Tailwind `@layer` directives only. Must live in `apps/web/src/app/`.

### 2. No localized fields on system identifiers
- `slug`, `status`, enum fields, and any field used as a database key/identifier **must NOT** have `localized: true`.
- Only user-facing display strings (`title`, `body`, `label`, `description`, `tagline`, etc.) may be localized.
- Rationale: localized slugs create duplicate URL spaces and break stable references across locales.

### 3. All blocks must support live-preview natively
- Every block added to a Payload `blocks` array must have a corresponding React component registered in `apps/web/src/components/cms/RenderBlocks.tsx`.
- The block component must accept `locale` and render correctly with no extra data-fetching (all data flows through the page-level `useLivePreview` hook).
- New block types without a matching renderer are forbidden from being merged.

### 4. Payload separation of concerns
- `apps/cms` is the **Single Source of Truth** for the Payload 3 schema, admin panel, Postgres adapter, and media uploads (S3/MinIO).
- `apps/web` uses the Payload **Local API** (`getPayload()`) only for Server Actions that mutate data inline. It must NOT re-expose its own admin panel or REST/GraphQL endpoints.
- The `(payload)` admin route group lives exclusively in `apps/cms/src/app/(payload)/`. Do not add it back to `apps/web`.
- New Payload collections and globals must be defined in `apps/cms/src/collections/` and `apps/cms/src/globals/`, then mirrored to `apps/web/src/` only if web's Local API requires them for Server Actions.

### 5. Media discipline
- All user/client-uploaded media (product images, editorial photos) must be stored in S3/MinIO via the `@payloadcms/storage-s3` plugin configured in both app configs.
- No binary assets (photos, videos) committed to git. Only static brand assets (SVG logos, favicons, OG placeholder) belong in `apps/web/public/`.
- `apps/web/media/`, `apps/web/public/images/`, and `apps/web/public/media-uploads/` are **permanently forbidden** — these dirs were purged in the Little Biceps cleanup (2026-06-20) and must not be recreated.
