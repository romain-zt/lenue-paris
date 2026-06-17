# Slice: editorial--capsule-limited-series

**Client points:** #5 — série limitée / collection capsule (editorial truth, no fake scarcity)

## Acceptance

- [ ] `Products.limitedSeries` checkbox (dresses only) — editor-controlled per SKU
- [ ] `Pages` hero block `showCapsuleBadge` — quiet badge on home hero when enabled
- [ ] `CapsuleBadge` component — uppercase tracking, stone/white muted typography (not sale-red urgency)
- [ ] Product detail shows badge when `limitedSeries` is true (tri-locale `product.limitedSeriesBadge`)
- [ ] Home hero shows badge when CMS `showCapsuleBadge` is true (tri-locale `home.capsuleBadge`)
- [ ] Seed: public dress slugs `limitedSeries: true`; home hero `showCapsuleBadge: true`
- [ ] No marketplace urgency copy (`limited stock`, countdown, `X left`, strikethrough)
- [ ] `pnpm --filter web test` green; `luxury-gate --diff apps/web` pass, `llm_calls: 0`

## Paths (allowlist)

- `apps/web/src/collections/Products.ts`
- `apps/web/src/collections/Pages.ts`
- `apps/web/src/components/editorial/CapsuleBadge.tsx`
- `apps/web/src/components/cms/HeroBlock.tsx`
- `apps/web/src/components/cms/ProductPageContent.tsx`
- `apps/web/src/components/cms/HomePageContent.tsx`
- `apps/web/src/lib/cms/blocks.ts`, `types.ts`
- `apps/web/src/types/product.ts`
- `apps/web/src/i18n/admin-labels.ts`
- `apps/web/messages/*.json`
- `apps/web/src/seed.ts`
- `apps/web/src/migrations/*capsule*`
- `apps/web/src/payload-types.ts`

## Out of scope

- Photography editorial (#6)
- Fake scarcity timers or stock counts
- Journal page (#10)
