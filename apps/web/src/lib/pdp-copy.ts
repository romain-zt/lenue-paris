import type { SupportedLocale } from "@repo/catalog";

export interface PdpCopy {
  orderCta: string;
  notFoundTitle: string;
  notFoundBody: string;
  backToCatalogue: string;
  errorTitle: string;
  errorBody: string;
  galleryLabel: string;
  lengthGroupLabel: string;
  sizeGroupLabel: string;
  lengthLonger: string;
  lengthShorter: string;
  selectionRequired: string;
  missingLength: string;
  missingSize: string;
}

const COPY: Record<SupportedLocale, PdpCopy> = {
  fr: {
    orderCta: "Commander",
    notFoundTitle: "Cette pièce n'est plus disponible",
    notFoundBody:
      "Elle a peut-être quitté la collection. Découvrez nos autres pièces.",
    backToCatalogue: "Retour au catalogue",
    errorTitle: "Page indisponible",
    errorBody: "Impossible de charger cette fiche pour le moment. Réessayez bientôt.",
    galleryLabel: "Galerie photos",
    lengthGroupLabel: "Longueur",
    sizeGroupLabel: "Taille",
    lengthLonger: "Plus long",
    lengthShorter: "Plus court",
    selectionRequired: "Choisissez une longueur et une taille pour continuer.",
    missingLength: "Sélectionnez une longueur.",
    missingSize: "Sélectionnez une taille.",
  },
  en: {
    orderCta: "Order",
    notFoundTitle: "This piece is no longer available",
    notFoundBody: "It may have left the collection. Browse our other pieces.",
    backToCatalogue: "Back to catalogue",
    errorTitle: "Page unavailable",
    errorBody: "We couldn't load this product right now. Please try again soon.",
    galleryLabel: "Photo gallery",
    lengthGroupLabel: "Length",
    sizeGroupLabel: "Size",
    lengthLonger: "Longer",
    lengthShorter: "Shorter",
    selectionRequired: "Choose a length and size to continue.",
    missingLength: "Select a length.",
    missingSize: "Select a size.",
  },
  ru: {
    orderCta: "Заказать",
    notFoundTitle: "Это изделие больше недоступно",
    notFoundBody:
      "Возможно, оно уже не в коллекции. Посмотрите другие изделия.",
    backToCatalogue: "Вернуться в каталог",
    errorTitle: "Страница недоступна",
    errorBody: "Не удалось загрузить карточку товара. Попробуйте позже.",
    galleryLabel: "Фотогалерея",
    lengthGroupLabel: "Длина",
    sizeGroupLabel: "Размер",
    lengthLonger: "Длиннее",
    lengthShorter: "Короче",
    selectionRequired: "Выберите длину и размер, чтобы продолжить.",
    missingLength: "Выберите длину.",
    missingSize: "Выберите размер.",
  },
};

export function getPdpCopy(locale: SupportedLocale): PdpCopy {
  return COPY[locale];
}

export { formatCataloguePrice as formatProductPrice } from "./catalogue-copy";
