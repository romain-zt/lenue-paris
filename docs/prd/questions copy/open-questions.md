# Open Questions

| ID | Question | Priority | Status | Answer |
|----|----------|:--------:|--------|--------|
| Q-001 | What WhatsApp number will receive orders? | high | answered | +7 911 712-62-62 (+79117126262 E.164) |
| Q-002 | Should the site be French-only or bilingual fr/en from day 1? | medium | answered | **fr + en + ru** — all three mandatory at launch (not phased). French primary. *(Question framed fr/en only; superseded by answer + PRD.md § Product Surface / Languages.)* |
| Q-003 | Is there a brand name / logo asset ready? | high | answered | Brand: **Lénue Paris** (é). No standalone logo file — wordmark visible on product photos in `lenue-assets-bootstrap/pics/`. v0: typography wordmark. |
| Q-004 | How many products at launch? | medium | answered | 4 dresses (2 length variants each: longer/shorter) + 4 bags + 4 scarfs — bags/scarfs paired to complete their related dress (~12 entities, 16 dress SKUs if variants split). |
| Q-005 | Should product sizes be free-text or a fixed set (XS/S/M/L/XL)? | medium | answered | **Fixed size set required for dresses** at checkout (alongside length variant). Default assumption: XS/S/M/L/XL unless owner specifies otherwise. Bags/scarfs: no size picker. |
| Q-006 | Does the owner want to see orders in the CMS admin or just via WhatsApp is enough? | low | answered | **CMS admin required.** On WhatsApp handoff, order must be saved for admin (silent server save as part of checkout — WA link + CMS persist in one action). |
| Q-007 | Any social media links to include (Instagram, etc.)? | low | answered | **Instagram yes** — placeholder URL until real profile confirmed. No other social required at launch. |
| Q-008 | Preferred S3 region? (eu-west-3 Paris assumed) | low | answered | **eu-west-3 (Paris)** confirmed. |
| Q-009 | Who is the primary buyer market given +7 WhatsApp, mandatory ru locale, and PRD “Parisian woman” positioning — Paris/FR, Russia/CIS, international EN, or all equally? | high | answered | **Russian woman living in France** — primary ICP; fr/en/ru all serve this profile (France-based, Russian-speaking). *(Supersedes bootstrap PRD “Parisian woman” — persisted in PRD.md § Target user.)* |
| Q-010 | Are product prices displayed on the storefront and included in the WhatsApp order message? | medium | answered | **Yes** — prices visible on site and included in WA order message + CMS order. Offline settlement via WhatsApp; EUR assumed (France-based buyer). |
| Q-011 | Where does the boutique ship for v0 — France only, EU, or wider? | medium | answered | **Not specified in v0** — manual order process; shipping handled offline in WhatsApp conversation. |
| Q-012 | Should the storefront surface dress–bag–scarf pairings (“complete the look”) at launch? | medium | answered | **Pairings in CMS/data model yes; buyer-facing pairing UI no for v0** — fastest path: flat catalogue + PDP. Defer “complete the look” surfacing. |
