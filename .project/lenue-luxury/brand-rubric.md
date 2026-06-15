# Lénue Paris — brand rubric (advisory)

Deterministic pass/fail lives in `quality_floor.yaml`. This file guides **post-floor-failure** LLM advisory review only. A 5/5 rubric score cannot unblock `validated → complete` when any deterministic floor failed.

## Reference maison

- [Rouje](https://www.rouje.com) — warm, feminine, editorial photography
- [Loro Piana](https://fr.loropiana.com) — luxury restraint, generous whitespace
- [The Row](https://www.therow.com) — extreme minimalism, typography-forward
- [Dôen](https://www.shopdoen.com) — soft, natural, lifestyle photography

## Copy (advisory)

- WhatsApp CTA reads as invitation: "Commander sur WhatsApp", "Continue in WhatsApp"
- Intimate second-person register; editorial blocks ≤ 18 words average
- No urgency/scarcity copy

## Design (advisory)

- Navigation ≤ 5 top-level items; no cart, badges, stars, discount ribbons
- Product tiles: one hero frame per piece, not multi-thumb marketplace grids

## SEO / i18n (advisory)

- Russian copy: native boutique register, not stiff French transliteration
- Meta descriptions differ per locale

## Image / motion (advisory)

- Mood cadence calibrated against `lenue-assets-bootstrap/pics/` via `phash/reference-manifest.json`
- Editorial full-bleed alternates with restrained packshot — not uniform white-background tiles
- Hero video ≤ 8s, muted, no kinetic typography
