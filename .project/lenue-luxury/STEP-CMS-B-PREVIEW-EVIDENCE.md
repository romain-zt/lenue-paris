# STEP CMS-b-preview — Live preview (Pages + Products)

## Allowlist (one commit only)

- `apps/web/src/lib/cms/generatePreviewPath.ts`
- `apps/web/src/app/next/preview/route.ts`
- `apps/web/src/components/cms/LivePreviewListener.tsx`
- `apps/web/src/components/cms/HomePageContent.tsx`
- `apps/web/src/components/cms/ProductPageContent.tsx`
- `apps/web/src/lib/cms/queries.ts` (draft fetches)
- `apps/web/src/lib/cms/blocks.ts` (`mapPayloadProductDetail`)
- `apps/web/src/app/[locale]/layout.tsx` (draft-gated listener)
- `apps/web/src/app/[locale]/page.tsx`, `produits/[slug]/page.tsx`
- `apps/web/src/collections/Pages.ts`, `Products.ts`
- `apps/web/src/payload.config.ts` (cors, breakpoints)
- `apps/web/package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- `apps/web/src/lib/cms/__tests__/generatePreviewPath.test.ts`

**Forbidden in this commit:** WhatsApp selection, hero video, Collections schema changes, orchestrator/gate WIP.

## Mechanical sign-off (Skeptic)

1. Payload admin → edit home hero `tagline` → preview iframe on `/fr` updates without full reload
2. Edit **Robe Camille** gallery in **Produits** → `/fr/produits/robe-camille` updates on save
3. Breakpoint selector shows 375 / 768 / 1440
4. `pnpm --filter web test src/lib/cms/__tests__/generatePreviewPath.test.ts` green
5. Grep allowlist: no WhatsApp, no hero video, no Collections schema diff

## PREVIEW_SECRET (prod)

- Generate once: `openssl rand -base64 32`
- Add `PREVIEW_SECRET` in Vercel env (never commit)
- Without it: local preview on port **3001** works; prod admin “Open preview” returns **403** (fail closed)
- `NEXT_PUBLIC_SITE_URL=https://www.lenue.paris` for prod preview URLs

## Pass record

```yaml
commit: b713b6c
forbidden_paths_touched: none
generatePreviewPath_tests: 4/4
typecheck: pass
preview_secret_prod: optional — set in Vercel for admin preview
local_preview_port: 3001
collections_preview: deferred (Pages + Products only)
```
