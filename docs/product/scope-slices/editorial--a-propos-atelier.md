# Slice: editorial--a-propos-atelier

## Goal
Ship client brief points #4 (rewrite à-propos as robe-only atelier, not multimarque) and #8 (add the robe story — viscose, coupe, petites séries) with tone passing the Maison Lens bar (The Row / Toteme cadence, zero marketplace tells).

## Acceptance criteria
- [ ] `brandPageCopy.ts` no longer exports buyer-facing copy (file emptied)
- [ ] `getBrandPageData` reads CMS only; returns `{ title: "", body: "", cover: null }` when no CMS page
- [ ] `page.tsx` metadata uses `about.metaTitle` / `about.metaDescription` from i18n (no `BRAND_PAGE_COPY` import)
- [ ] `messages/fr.json` `about.metaDescription` → "La maison de robes créée à Paris."
- [ ] `messages/en.json` `about.metaDescription` → "The house of dresses born in Paris."
- [ ] `messages/ru.json` `about.metaDescription` → "Дом платьев, рождённый в Париже."
- [ ] `home.editorialCta` updated in all three locales and in `seed.ts` ("Voir la collection" / "See the collection" / "Смотреть коллекцию")
- [ ] `seed.ts` exports `seedAProposPage` that upserts a published `a-propos` Page with tri-locale "Notre histoire" body
- [ ] FR body is verbatim from client brief (paragraph breaks preserved as `\n\n`, single line breaks as `\n`)
- [ ] EN body reads as native The Row / Toteme atelier prose (not stiff translation)
- [ ] RU body uses native boutique register ("дом платьев", sensory viscose, no literal transliteration)
- [ ] `BrandPageContent.tsx` renders single `\n` breaks as `<br/>` for poetic line formatting
- [ ] `pnpm --filter web test` green (all tests including updated BrandPage tests)
- [ ] `luxury-brand-gate --diff apps/web` exits 0, `llm_calls: 0`, `marketplace_grep` pass

## Paths modified
- `apps/web/src/lib/brandPageCopy.ts`
- `apps/web/src/lib/getBrandPageData.ts`
- `apps/web/src/lib/__tests__/getBrandPageData.test.ts`
- `apps/web/src/app/[locale]/(storefront)/a-propos/page.tsx`
- `apps/web/src/app/[locale]/(storefront)/a-propos/BrandPageContent.tsx`
- `apps/web/src/app/[locale]/(storefront)/a-propos/BrandPage.test.tsx`
- `apps/web/src/seed.ts`
- `apps/web/messages/fr.json`
- `apps/web/messages/en.json`
- `apps/web/messages/ru.json`

## Not in scope
- `editorial--capsule-limited-series` (#5 — "série limitée" badge)
- Photography (#6)
- Journal (#10)
