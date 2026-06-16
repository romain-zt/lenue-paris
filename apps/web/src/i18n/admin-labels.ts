/** Boutique admin copy — fr / en / ru (Payload admin UI, not storefront content). */

export type AdminLabel = { en: string; fr: string; ru: string };

export const ADMIN_GROUPS = {
  boutique: {
    en: "Boutique",
    fr: "Boutique",
    ru: "Бутик",
  },
  editorial: {
    en: "Editorial content",
    fr: "Contenu éditorial",
    ru: "Редакционный контент",
  },
  media: {
    en: "Media",
    fr: "Médias",
    ru: "Медиа",
  },
  orders: {
    en: "Orders",
    fr: "Commandes",
    ru: "Заказы",
  },
} satisfies Record<string, AdminLabel>;

export const COLLECTION_LABELS = {
  pages: {
    singular: { en: "Page", fr: "Page", ru: "Страница" },
    plural: { en: "Pages", fr: "Pages", ru: "Страницы" },
  },
  products: {
    singular: { en: "Product", fr: "Produit", ru: "Товар" },
    plural: { en: "Products", fr: "Produits", ru: "Товары" },
  },
  collections: {
    singular: { en: "Collection", fr: "Collection", ru: "Коллекция" },
    plural: { en: "Collections", fr: "Collections", ru: "Коллекции" },
  },
  media: {
    singular: { en: "Media file", fr: "Fichier média", ru: "Медиафайл" },
    plural: { en: "Media", fr: "Médias", ru: "Медиа" },
  },
} satisfies Record<string, { singular: AdminLabel; plural: AdminLabel }>;

export const FIELD_LABELS = {
  title: { en: "Title", fr: "Titre", ru: "Название" },
  slug: { en: "URL slug", fr: "Identifiant URL", ru: "URL-идентификатор" },
  cover: { en: "Cover image", fr: "Image de couverture", ru: "Обложка" },
  body: { en: "Body text", fr: "Texte", ru: "Текст" },
  blocks: { en: "Page blocks", fr: "Blocs de page", ru: "Блоки страницы" },
  mainImage: { en: "Main product photo", fr: "Photo principale", ru: "Главное фото" },
  gallery: { en: "Image gallery", fr: "Galerie photos", ru: "Галерея" },
  description: { en: "Description", fr: "Description", ru: "Описание" },
  price: { en: "Price (EUR)", fr: "Prix (EUR)", ru: "Цена (EUR)" },
  category: { en: "Category", fr: "Catégorie", ru: "Категория" },
  inStock: { en: "In stock", fr: "En stock", ru: "В наличии" },
  alt: { en: "Alt text (accessibility)", fr: "Texte alternatif", ru: "Альтернативный текст" },
  products: { en: "Products", fr: "Produits", ru: "Товары" },
  hero: { en: "Hero image", fr: "Image hero", ru: "Главное изображение" },
  heroImage: { en: "Hero image", fr: "Image hero", ru: "Главное изображение" },
  heroVideo: {
    en: "Hero video (optional)",
    fr: "Vidéo hero (optionnelle)",
    ru: "Hero-видео (необязательно)",
  },
  season: { en: "Season line", fr: "Ligne saison", ru: "Сезонная линия" },
  tagline: { en: "Tagline", fr: "Accroche", ru: "Слоган" },
  ctaLabel: { en: "Button label", fr: "Texte du bouton", ru: "Текст кнопки" },
  ctaLink: { en: "Button link", fr: "Lien du bouton", ru: "Ссылка кнопки" },
  sourceType: { en: "Product source", fr: "Source des produits", ru: "Источник товаров" },
  viewCollectionLabel: {
    en: "View collection label",
    fr: "Libellé « Voir la collection »",
    ru: "Подпись « Смотреть коллекцию »",
  },
  collection: { en: "Collection", fr: "Collection", ru: "Коллекция" },
  featuredProducts: {
    en: "Featured products",
    fr: "Produits mis en avant",
    ru: "Избранные товары",
  },
  productGrid: { en: "Product grid", fr: "Grille produits", ru: "Сетка товаров" },
  editorialStrip: { en: "Editorial strip", fr: "Bandeau éditorial", ru: "Редакционная полоса" },
  label: { en: "Eyebrow label", fr: "Sur-titre", ru: "Надзаголовок" },
  headline: { en: "Headline", fr: "Titre principal", ru: "Заголовок" },
  subline: { en: "Subline", fr: "Sous-titre", ru: "Подзаголовок" },
  image: { en: "Image", fr: "Image", ru: "Изображение" },
  availableSizes: { en: "Available sizes", fr: "Tailles disponibles", ru: "Доступные размеры" },
  availableLengths: { en: "Available lengths", fr: "Longueurs disponibles", ru: "Доступные длины" },
  pairings: { en: "Pairings (internal)", fr: "Associations (interne)", ru: "Сочетания (внутр.)" },
} satisfies Record<string, AdminLabel>;

export const FIELD_DESCRIPTIONS = {
  slugPage: {
    en: "URL-safe identifier. Use 'home' for the storefront homepage.",
    fr: "Identifiant pour l'URL. Utilisez « home » pour la page d'accueil.",
    ru: "Идентификатор для URL. Используйте « home » для главной страницы.",
  },
  slugProduct: {
    en: "URL-safe identifier. Auto-generated from title if left blank.",
    fr: "Identifiant URL. Généré automatiquement à partir du titre si vide.",
    ru: "URL-идентификатор. Создаётся из названия, если оставить пустым.",
  },
  slugCollection: {
    en: "URL segment for /collections/[slug]",
    fr: "Segment d'URL pour /collections/[slug]",
    ru: "Сегмент URL для /collections/[slug]",
  },
  inStock: {
    en: "Uncheck to show as out of stock — buyers can express interest via WhatsApp.",
    fr: "Décochez si rupture — les clientes peuvent vous écrire sur WhatsApp.",
    ru: "Снимите галочку при отсутствии — покупательницы могут написать в WhatsApp.",
  },
  gallery: {
    en: "Additional product photos (shown after the main image).",
    fr: "Photos supplémentaires (affichées après l'image principale).",
    ru: "Дополнительные фото (после главного изображения).",
  },
  description: {
    en: "Product description shown on the detail page.",
    fr: "Description affichée sur la fiche produit.",
    ru: "Описание на странице товара.",
  },
  price: {
    en: "Price in EUR (e.g. 290.00)",
    fr: "Prix en euros (ex. 290,00)",
    ru: "Цена в евро (напр. 290,00)",
  },
  collectionsProducts: {
    en: "Drag to reorder — storefront respects this order.",
    fr: "Glissez pour réordonner — la boutique respecte cet ordre.",
    ru: "Перетащите для сортировки — витрина сохранит порядок.",
  },
  collectionsHero: {
    en: "Optional editorial hero for the collection page.",
    fr: "Image hero optionnelle pour la page collection.",
    ru: "Необязательное hero-изображение для страницы коллекции.",
  },
  collectionsIntro: {
    en: "Curated product groups — Été 2026, Sacs, Nouveautés. Never one Page per SKU.",
    fr: "Groupes de produits — Été 2026, Sacs, Nouveautés. Jamais une page par référence.",
    ru: "Подборки товаров — Été 2026, Sacs, Nouveautés. Не создавайте страницу на каждый SKU.",
  },
  heroVideo: {
    en: "Optional muted loop (max 8 s). Poster uses the hero image. Respects reduced-motion.",
    fr: "Boucle muette optionnelle (max 8 s). L'image hero sert d'affiche. Respecte prefers-reduced-motion.",
    ru: "Необязательный беззвучный цикл (до 8 с). Постер — hero-изображение. Учитывает prefers-reduced-motion.",
  },
} satisfies Record<string, AdminLabel>;

export const SELECT_LABELS = {
  manual: { en: "Manual product picks", fr: "Sélection manuelle", ru: "Ручной выбор" },
  fromCollection: { en: "From collection", fr: "Depuis une collection", ru: "Из коллекции" },
  allProducts: { en: "All products", fr: "Tous les produits", ru: "Все товары" },
  dresses: { en: "Dresses", fr: "Robes", ru: "Платья" },
  bags: { en: "Bags", fr: "Sacs", ru: "Сумки" },
  scarfs: { en: "Scarves", fr: "Foulards", ru: "Шарфы" },
  longer: { en: "Long version", fr: "Version longue", ru: "Длинная версия" },
  shorter: { en: "Short version", fr: "Version courte", ru: "Короткая версия" },
} satisfies Record<string, AdminLabel>;
