import type { GlobalConfig } from "payload";
import { ADMIN_GROUPS } from "../i18n/admin-labels";

/**
 * Brand design tokens editable in the admin panel.
 * Field names map directly to CSS variable names (camelCase → kebab):
 *   colorPrimary  →  --color-primary
 *   colorAccent   →  --color-accent
 *   etc.
 * Changing a value propagates to the UI immediately — no deploy required.
 */
export const DesignTokens: GlobalConfig = {
  slug: "design-tokens",
  label: {
    en: "Design tokens",
    fr: "Tokens de design",
    ru: "Токены дизайна",
  },
  admin: {
    group: ADMIN_GROUPS.editorial,
    description: {
      en: "Brand colours. Changes propagate immediately — no deploy needed.",
      fr: "Couleurs de la marque. Les modifications s'appliquent immédiatement.",
      ru: "Цвета бренда. Изменения применяются мгновенно — деплой не нужен.",
    },
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      type: "collapsible",
      label: { en: "Text colours", fr: "Couleurs du texte", ru: "Цвета текста" },
      admin: { initCollapsed: false },
      fields: [
        {
          name: "colorPrimary",
          type: "text",
          defaultValue: "#1c1917",
          label: { en: "Primary text", fr: "Texte principal", ru: "Основной текст" },
          admin: { description: { en: "Headings, product titles, nav. → text-primary", fr: "Titres, produits, nav. → text-primary", ru: "Заголовки, товары, меню." } },
        },
        {
          name: "colorSecondary",
          type: "text",
          defaultValue: "#44403c",
          label: { en: "Secondary text", fr: "Texte secondaire", ru: "Вторичный текст" },
          admin: { description: { en: "Body text, descriptions. → text-secondary", fr: "Corps du texte, descriptions. → text-secondary", ru: "Основной текст." } },
        },
        {
          name: "colorMuted",
          type: "text",
          defaultValue: "#78716c",
          label: { en: "Muted text", fr: "Texte atténué", ru: "Приглушённый текст" },
          admin: { description: { en: "Labels, captions. → text-muted", fr: "Libellés, légendes. → text-muted", ru: "Метки, подписи." } },
        },
        {
          name: "colorSubtle",
          type: "text",
          defaultValue: "#a8a29e",
          label: { en: "Subtle text", fr: "Texte subtil", ru: "Тонкий текст" },
          admin: { description: { en: "Decorative text, inactive states. → text-subtle", fr: "Texte décoratif, états inactifs. → text-subtle", ru: "Декоративный текст." } },
        },
      ],
    },
    {
      type: "collapsible",
      label: { en: "Surface colours", fr: "Couleurs de surface", ru: "Цвета поверхностей" },
      admin: { initCollapsed: false },
      fields: [
        {
          name: "colorPageBg",
          type: "text",
          defaultValue: "#faf7f4",
          label: { en: "Page background", fr: "Fond de page", ru: "Фон страницы" },
          admin: { description: { en: "Global body background. → bg-page-bg", fr: "Fond global de la page. → bg-page-bg", ru: "Фон всей страницы." } },
        },
        {
          name: "colorSurface",
          type: "text",
          defaultValue: "#ffffff",
          label: { en: "Surface (white cards, header)", fr: "Surface (cartes, header)", ru: "Поверхность" },
          admin: { description: { en: "Cards, panels, header background. → bg-surface", fr: "Cartes, panneaux, header. → bg-surface", ru: "Карточки, панели, шапка." } },
        },
        {
          name: "colorEditorial",
          type: "text",
          defaultValue: "#f0ebe4",
          label: { en: "Editorial background", fr: "Fond éditorial", ru: "Редакционный фон" },
          admin: { description: { en: "Warm tinted bg for editorial strip sections. → bg-editorial", fr: "Fond teinté chaud pour bandeaux éditoriaux. → bg-editorial", ru: "Тёплый фон для редакционных блоков." } },
        },
        {
          name: "colorSection",
          type: "text",
          defaultValue: "#f5f0ea",
          label: { en: "Section background", fr: "Fond de section", ru: "Фон секции" },
          admin: { description: { en: "Warm tinted bg for quote and feature sections. → bg-section", fr: "Fond teinté pour les sections citation et vedettes. → bg-section", ru: "Тёплый фон для секций." } },
        },
        {
          name: "colorSkeleton",
          type: "text",
          defaultValue: "#e8e5e2",
          label: { en: "Skeleton / loading bg", fr: "Fond squelette / chargement", ru: "Фон загрузки" },
          admin: { description: { en: "Placeholder background for loading states. → bg-skeleton", fr: "Fond de chargement des squelettes. → bg-skeleton", ru: "Фон при загрузке." } },
        },
      ],
    },
    {
      type: "collapsible",
      label: { en: "Accent / CTA colours", fr: "Couleurs d'accent / CTA", ru: "Акцент / CTA" },
      admin: { initCollapsed: false },
      fields: [
        {
          name: "colorAccent",
          type: "text",
          defaultValue: "#1c1917",
          label: { en: "Accent (CTA button bg)", fr: "Accent (fond bouton CTA)", ru: "Акцент (фон кнопки CTA)" },
          admin: { description: { en: "Button backgrounds, strong borders, focus rings. → bg-accent, border-accent, ring-accent", fr: "Fonds de boutons, bordures fortes, anneaux de focus. → bg-accent", ru: "Фон кнопок, акцентные границы." } },
        },
        {
          name: "colorAccentHover",
          type: "text",
          defaultValue: "#44403c",
          label: { en: "Accent hover state", fr: "Survol accent", ru: "Наведение на акцент" },
          admin: { description: { en: "Button hover colour. → hover:bg-accent-hover", fr: "Couleur au survol du bouton. → hover:bg-accent-hover", ru: "Цвет кнопки при наведении." } },
        },
        {
          name: "colorAccentText",
          type: "text",
          defaultValue: "#ffffff",
          label: { en: "Accent text (on dark button)", fr: "Texte accent (bouton sombre)", ru: "Текст на акцентной кнопке" },
          admin: { description: { en: "Text colour on accent buttons. → text-accent-text", fr: "Texte sur boutons d'accent. → text-accent-text", ru: "Текст на акцентных кнопках." } },
        },
      ],
    },
    {
      type: "collapsible",
      label: { en: "Borders", fr: "Bordures", ru: "Границы" },
      admin: { initCollapsed: true },
      fields: [
        {
          name: "colorBorder",
          type: "text",
          defaultValue: "#e7e5e4",
          label: { en: "Structural border / divider", fr: "Bordure / séparateur", ru: "Граница / разделитель" },
          admin: { description: { en: "Header borders, card edges, dividers. → border-subtle, divide-subtle", fr: "Bordures header, arêtes carte, séparateurs. → border-subtle", ru: "Границы шапки, краи карточек." } },
        },
      ],
    },
    {
      type: "collapsible",
      label: { en: "Typography", fr: "Typographie", ru: "Типографика" },
      admin: { initCollapsed: true },
      fields: [
        {
          name: "fontSerif",
          type: "text",
          defaultValue: "Cormorant Garamond, Georgia, serif",
          label: { en: "Serif font stack", fr: "Police serif", ru: "Засечный шрифт" },
          admin: { description: { en: "Headings serif font stack.", fr: "Police à empattement pour les titres.", ru: "Шрифт с засечками для заголовков." } },
        },
        {
          name: "fontSans",
          type: "text",
          defaultValue: "Jost, Helvetica Neue, Arial, sans-serif",
          label: { en: "Sans-serif font stack", fr: "Police sans-serif", ru: "Шрифт без засечек" },
          admin: { description: { en: "Body sans-serif font stack.", fr: "Police sans empattement pour le corps du texte.", ru: "Шрифт без засечек для основного текста." } },
        },
      ],
    },
  ],
};
