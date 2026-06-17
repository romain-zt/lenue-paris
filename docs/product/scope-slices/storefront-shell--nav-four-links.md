# Scope Slice: Storefront shell — Nav four links (client #7)

## Status

`ready-for-user-stories`

---

## User Value

Buyers navigate a robe-only atelier with four clear links — Collection, À propos, Livraison, Contact — in header and footer, tri-locale, without sac/foulard chrome or marketplace tells.

---

## Exact Boundary

### Included

- Shared `STOREFRONT_NAV_LINKS` config (Collection · À propos · Livraison · Contact)
- `Header.tsx`: desktop left = Collection, right = À propos + Livraison + Contact (+ selection pill + locale)
- Mobile menu: all four links in depilated cards
- Footer: same four links (drop legacy « Boutique » home link)
- New editorial stub pages: `/livraison`, `/contact` (robe-only copy, not « Notre histoire »)
- Tri-locale `nav.*` + `footer.*` keys (fr/en/ru); remove `nav.bags` / `nav.scarfs` from buyer chrome
- Catalogue `metaDescription` robe-only (no sacs/foulards mention)
- Unit tests: `storefrontNav.test.ts`, updated `storefrontLinks.test.ts`

### Excluded

- Full « Notre histoire » rewrite — `editorial--a-propos-atelier` (#4/#8)
- Capsule badge (#5), photography editorial (#6), journal (#10)
- Sitemap.xml

---

## Allowlist

- `apps/web/src/lib/navigation/storefrontNav.ts`
- `apps/web/src/components/Header.tsx`
- `apps/web/src/app/[locale]/layout.tsx`
- `apps/web/src/app/[locale]/(storefront)/livraison/page.tsx`
- `apps/web/src/app/[locale]/(storefront)/contact/page.tsx`
- `apps/web/src/lib/editorial/deliveryPageCopy.ts`
- `apps/web/src/lib/editorial/contactPageCopy.ts`
- `apps/web/messages/fr.json`, `en.json`, `ru.json`
- `apps/web/src/lib/navigation/__tests__/storefrontNav.test.ts`
- `apps/web/src/lib/catalogue/__tests__/storefrontLinks.test.ts`

---

## Acceptance

- [ ] Header + footer show exactly four links with tri-locale labels
- [ ] `/livraison` and `/contact` render without 404
- [ ] No `nav.bags` / `nav.scarfs` in header/footer; catalogue meta robe-only
- [ ] `pnpm --filter web test` green
- [ ] `npm run luxury-gate -- --diff apps/web` exit 0, `llm_calls: 0`
- [ ] `marketplace-grep` pass (no cart icon)
