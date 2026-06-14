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
| i18n       | on                   | fr (primary) + en                                   |
| Deployment | —                    | Vercel (monorepo: apps/web + apps/cms same project) |


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

