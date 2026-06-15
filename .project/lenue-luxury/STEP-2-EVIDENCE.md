# Step 2 evidence — luxury-brand-gate.ts + maison-scorers

Step 2 is done when the gate fails `marketplace-heavy.html` and passes `maison-pass.html` with `llm_calls: 0`.

## Commands

```bash
cd .github/scripts/core
npm run test:maison          # 10/10 unit tests
npm run luxury-gate -- --fixture marketplace-heavy   # exit 1
npm run luxury-gate -- --fixture maison-pass         # exit 0
```

## marketplace-heavy failures (≥6 floors)

Gate emits structured rows `{ floor_id, observed, threshold, reference_violated, status }`:

1. `marketplace_grep` — forbidden strings/elements
2. `typography_accent` — `Lenue` without `é`
3. `i18n_key_parity` — missing en/ru keys
4. `layout_metrics` — card-in-card, grid density, gutters, whitespace
5. `palette_chroma` — sale-red / cart-orange tokens
6. `asset_contract` — inline base64
7. `alt_coverage` — empty alt on product tiles

## maison-pass

All deterministic scorers pass in `--fixture` mode. Lighthouse and S3/ffprobe report `blocked` (not fail) until preview exists.

## Step 2 blockers deferred to Step 2.1

- `phash_mood_board` scorer with pinned `LANCZOS` resize (requires hero image path + sharp)
- Deterministic `hreflang` scorer (advisory-only until pass fixture + storefront ship hreflang triple)

## Not in Step 2 scope (per contract)

- No `CURSOR_API_KEY` / subagent spawn in gate
- No worker allowlist patch
- No `REQUIRED_CHECKS` / CI workflow wiring
- No LLM advisory reviewers
