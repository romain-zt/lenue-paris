# Step 1 evidence — Lénue Luxury overlay

Maison Lens bar frozen on disk. Step 2 (`luxury-brand-gate.ts` + maison scorers) must prove:

- `fixtures/marketplace-heavy.html` fails ≥3 deterministic floors
- `fixtures/maison-pass.html` passes all deterministic floors
- `selectors/storefront-shell--global-chrome.json` is the golden selector source (not comments in brand-rubric)
- `phash/reference-manifest.json` holds dhash-8x8 from `lenue-assets-bootstrap/pics/` with numeric thresholds

Expected marketplace-heavy failures (step 2 must detect):

1. `marketplace_grep` — "Buy now", "Add to cart", "free shipping", cart icon, sticky buy bar
2. `typography_accent` — visible "Lenue" without é
3. `i18n_key_parity` — missing en/ru keys
4. `layout_metrics` — hero not full-bleed, card-in-card, whitespace below 0.38, 4 columns below 768px
5. `palette_chroma` — sale-red / cart-orange tokens
6. `asset_contract` — inline base64 image

Lighthouse, S3 HEAD, and ffprobe scorers gate-block as `preview_unavailable` / `asset_host_unreachable` until the monorepo preview exists.
