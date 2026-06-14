import type { SupportedLocale } from "@repo/catalog";

export interface CheckoutCopy {
  pageTitle: string;
  productSummaryLabel: string;
  lengthLabel: string;
  sizeLabel: string;
  nameLabel: string;
  phoneLabel: string;
  emailLabel: string;
  emailOptionalHint: string;
  submitCta: string;
  submittingLabel: string;
  successTitle: string;
  successBody: string;
  whatsappFallbackTitle: string;
  whatsappFallbackBody: string;
  whatsappLinkLabel: string;
  saveFailedTitle: string;
  saveFailedBody: string;
  retryCta: string;
  variantsMissingTitle: string;
  variantsMissingBody: string;
  backToProduct: string;
  notFoundTitle: string;
  notFoundBody: string;
  backToCatalogue: string;
  errorTitle: string;
  errorBody: string;
}

const COPY: Record<SupportedLocale, CheckoutCopy> = {
  fr: {
    pageTitle: "Commander",
    productSummaryLabel: "Votre sélection",
    lengthLabel: "Longueur",
    sizeLabel: "Taille",
    nameLabel: "Nom",
    phoneLabel: "Téléphone",
    emailLabel: "E-mail",
    emailOptionalHint: "Facultatif",
    submitCta: "Enregistrer et continuer sur WhatsApp",
    submittingLabel: "Enregistrement en cours…",
    successTitle: "Commande enregistrée",
    successBody:
      "Votre commande a bien été transmise à la boutique. Nous ouvrons WhatsApp pour finaliser avec vous.",
    whatsappFallbackTitle: "Ouvrir WhatsApp manuellement",
    whatsappFallbackBody:
      "Si WhatsApp ne s'ouvre pas, utilisez le lien ci-dessous ou contactez-nous au",
    whatsappLinkLabel: "Continuer sur WhatsApp",
    saveFailedTitle: "Enregistrement impossible",
    saveFailedBody:
      "Nous n'avons pas pu enregistrer votre commande. Vérifiez votre connexion et réessayez.",
    retryCta: "Réessayer",
    variantsMissingTitle: "Choix de taille ou longueur manquant",
    variantsMissingBody:
      "Retournez à la fiche produit pour choisir une longueur et une taille avant de commander.",
    backToProduct: "Retour à la fiche produit",
    notFoundTitle: "Cette pièce n'est plus disponible",
    notFoundBody:
      "Elle a peut-être quitté la collection. Découvrez nos autres pièces.",
    backToCatalogue: "Retour au catalogue",
    errorTitle: "Page indisponible",
    errorBody: "Impossible de charger cette commande pour le moment. Réessayez bientôt.",
  },
  en: {
    pageTitle: "Order",
    productSummaryLabel: "Your selection",
    lengthLabel: "Length",
    sizeLabel: "Size",
    nameLabel: "Name",
    phoneLabel: "Phone",
    emailLabel: "Email",
    emailOptionalHint: "Optional",
    submitCta: "Save and continue on WhatsApp",
    submittingLabel: "Saving your order…",
    successTitle: "Order saved",
    successBody:
      "Your order has been sent to the boutique. We are opening WhatsApp so you can finish with us.",
    whatsappFallbackTitle: "Open WhatsApp manually",
    whatsappFallbackBody:
      "If WhatsApp does not open, use the link below or reach us at",
    whatsappLinkLabel: "Continue on WhatsApp",
    saveFailedTitle: "Could not save your order",
    saveFailedBody:
      "We could not record your order. Check your connection and try again.",
    retryCta: "Try again",
    variantsMissingTitle: "Length or size not selected",
    variantsMissingBody:
      "Go back to the product page to choose a length and size before ordering.",
    backToProduct: "Back to product",
    notFoundTitle: "This piece is no longer available",
    notFoundBody: "It may have left the collection. Browse our other pieces.",
    backToCatalogue: "Back to catalogue",
    errorTitle: "Page unavailable",
    errorBody: "We could not load checkout right now. Please try again soon.",
  },
  ru: {
    pageTitle: "Заказ",
    productSummaryLabel: "Ваш выбор",
    lengthLabel: "Длина",
    sizeLabel: "Размер",
    nameLabel: "Имя",
    phoneLabel: "Телефон",
    emailLabel: "E-mail",
    emailOptionalHint: "Необязательно",
    submitCta: "Сохранить и продолжить в WhatsApp",
    submittingLabel: "Сохраняем заказ…",
    successTitle: "Заказ сохранён",
    successBody:
      "Ваш заказ передан в бутик. Открываем WhatsApp, чтобы завершить оформление.",
    whatsappFallbackTitle: "Открыть WhatsApp вручную",
    whatsappFallbackBody:
      "Если WhatsApp не открылся, используйте ссылку ниже или напишите нам по номеру",
    whatsappLinkLabel: "Продолжить в WhatsApp",
    saveFailedTitle: "Не удалось сохранить заказ",
    saveFailedBody:
      "Не удалось записать заказ. Проверьте соединение и попробуйте снова.",
    retryCta: "Повторить",
    variantsMissingTitle: "Не выбраны длина или размер",
    variantsMissingBody:
      "Вернитесь на страницу товара, чтобы выбрать длину и размер перед заказом.",
    backToProduct: "Вернуться к товару",
    notFoundTitle: "Это изделие больше недоступно",
    notFoundBody:
      "Возможно, оно уже не в коллекции. Посмотрите другие изделия.",
    backToCatalogue: "Вернуться в каталог",
    errorTitle: "Страница недоступна",
    errorBody: "Не удалось загрузить оформление заказа. Попробуйте позже.",
  },
};

export function getCheckoutCopy(locale: SupportedLocale): CheckoutCopy {
  return COPY[locale];
}
