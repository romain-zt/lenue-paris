# US-001: Switch storefront language

**Slice:** i18n--localized-storefront  
**Status:** ready-for-implementation

## Story

As a buyer, I want to choose French, English, or Russian for the whole storefront so the boutique feels native to me.

## Acceptance Criteria

1. The storefront shows French by default on first visit.
2. The buyer can switch to English or Russian using a language selector.
3. After switching, all buyer-facing UI text (header, catalogue, product detail, checkout form, footer, about page) renders in the chosen language.
4. Navigating to another page keeps the chosen language — it does not reset to French.
5. When a translation is missing for the active language, the French text is shown instead of a blank or key name.
6. Product titles and descriptions are fetched from the CMS in the active locale.
7. The editorial (about) page is presented in the active locale.

## UX States

| State | Expected behavior |
|-------|-------------------|
| Default | French on first visit, no locale prefix in URL |
| Switched | Chosen locale applied immediately, `/en/` or `/ru/` prefix in URL |
| Persisted | Locale stays on next navigation |
| Missing translation | French copy shown, not a key name or blank |
| Loading | Brief loading indicator while locale content fetches |
