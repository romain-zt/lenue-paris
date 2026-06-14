import type { ProductCategoryFilter, SupportedLocale } from "@repo/catalog";

export interface CatalogueCopy {
  title: string;
  emptyCatalogue: string;
  emptyCategory: string;
  viewAll: string;
  error: string;
  categoryLabels: Record<ProductCategoryFilter, string>;
}

const COPY: Record<SupportedLocale, CatalogueCopy> = {
  fr: {
    title: "Catalogue",
    emptyCatalogue: "La collection arrive bientôt. Revenez très prochainement.",
    emptyCategory: "Aucune pièce dans cette catégorie pour le moment.",
    viewAll: "Voir toute la collection",
    error: "Le catalogue est momentanément indisponible. Veuillez réessayer.",
    categoryLabels: {
      all: "Tout",
      dress: "Robes",
      bag: "Sacs",
      scarf: "Foulards",
    },
  },
  en: {
    title: "Catalogue",
    emptyCatalogue: "The collection is coming soon. Please check back shortly.",
    emptyCategory: "No pieces in this category yet.",
    viewAll: "View all pieces",
    error: "The catalogue is temporarily unavailable. Please try again.",
    categoryLabels: {
      all: "All",
      dress: "Dresses",
      bag: "Bags",
      scarf: "Scarves",
    },
  },
  ru: {
    title: "Каталог",
    emptyCatalogue: "Коллекция скоро появится. Загляните чуть позже.",
    emptyCategory: "В этой категории пока нет изделий.",
    viewAll: "Смотреть всю коллекцию",
    error: "Каталог временно недоступен. Пожалуйста, попробуйте снова.",
    categoryLabels: {
      all: "Все",
      dress: "Платья",
      bag: "Сумки",
      scarf: "Платки",
    },
  },
};

export function getCatalogueCopy(locale: SupportedLocale): CatalogueCopy {
  return COPY[locale];
}

export function formatCataloguePrice(
  price: number,
  locale: SupportedLocale,
): string {
  const intlLocale =
    locale === "ru" ? "ru-RU" : locale === "en" ? "en-GB" : "fr-FR";

  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}
