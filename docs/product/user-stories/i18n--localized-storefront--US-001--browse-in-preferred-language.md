# User Story: Browse in preferred language

**Slice:** i18n--localized-storefront  
**ID:** US-001

---

## Story

As a buyer visiting lenue.paris,  
I want to choose between French, English, and Russian,  
so that the entire storefront — navigation, product names, labels, and brand copy — feels native to me.

---

## Acceptance Criteria

1. **Default locale** — On first visit with no prior choice, the storefront is displayed in French.
2. **Locale switcher** — The header exposes FR / EN / RU controls on both desktop and mobile; tapping one immediately re-renders the page in the selected language.
3. **Persistent locale** — After switching, navigating to any other page (catalogue, product detail, brand page) keeps the chosen language without resetting to French.
4. **Missing-translation fallback** — Any section without a translation in the active locale renders the French copy instead of a blank area.
5. **Consistent application** — The shell (header/footer navigation labels), catalogue page, product detail page, brand (À propos) page, and checkout copy all honour the active locale.
6. **French URL prefix omitted** — URLs for the default locale (fr) have no `/fr/` prefix; English and Russian have `/en/` and `/ru/` respectively (`localePrefix: "as-needed"`).

---

## Out of Scope

- Authoring per-locale product/editorial copy in the CMS (covered by cms-products and editorial slices)
- Adding locales beyond fr / en / ru
- Currency / region localization
- Admin interface translation
