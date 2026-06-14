import type { SupportedLocale } from "@repo/catalog";
import type { ProductLengthVariant } from "@repo/product-detail";

const LENGTH_LABELS: Record<SupportedLocale, Record<ProductLengthVariant, string>> = {
  fr: { longer: "Plus longue", shorter: "Plus courte" },
  en: { longer: "Longer", shorter: "Shorter" },
  ru: { longer: "Длиннее", shorter: "Короче" },
};

const VALIDATION_MESSAGES: Record<
  SupportedLocale,
  Record<
    "customerNameRequired" | "customerPhoneRequired" | "customerEmailInvalid" | "lengthRequired" | "sizeRequired" | "lengthInvalid" | "sizeInvalid" | "productSlugRequired",
    string
  >
> = {
  fr: {
    customerNameRequired: "Indiquez votre nom",
    customerPhoneRequired: "Indiquez votre numéro de téléphone",
    customerEmailInvalid: "Adresse e-mail invalide",
    lengthRequired: "Choisissez une longueur",
    sizeRequired: "Choisissez une taille",
    lengthInvalid: "Longueur non disponible pour cette pièce",
    sizeInvalid: "Taille non disponible pour cette pièce",
    productSlugRequired: "Produit manquant",
  },
  en: {
    customerNameRequired: "Enter your name",
    customerPhoneRequired: "Enter your phone number",
    customerEmailInvalid: "Invalid email address",
    lengthRequired: "Choose a length",
    sizeRequired: "Choose a size",
    lengthInvalid: "Length not available for this piece",
    sizeInvalid: "Size not available for this piece",
    productSlugRequired: "Product is missing",
  },
  ru: {
    customerNameRequired: "Укажите ваше имя",
    customerPhoneRequired: "Укажите номер телефона",
    customerEmailInvalid: "Некорректный адрес e-mail",
    lengthRequired: "Выберите длину",
    sizeRequired: "Выберите размер",
    lengthInvalid: "Длина недоступна для этой модели",
    sizeInvalid: "Размер недоступен для этой модели",
    productSlugRequired: "Товар не указан",
  },
};

export type ValidationMessageKey = keyof (typeof VALIDATION_MESSAGES)["fr"];

export function getValidationMessage(
  locale: SupportedLocale,
  key: ValidationMessageKey,
): string {
  return VALIDATION_MESSAGES[locale][key];
}

export function getLengthLabel(
  locale: SupportedLocale,
  length: ProductLengthVariant,
): string {
  return LENGTH_LABELS[locale][length];
}

export interface WhatsAppOrderMessageLines {
  locale: SupportedLocale;
  productName: string;
  productSlug: string;
  priceEur: number;
  length?: ProductLengthVariant;
  size?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
}

/** Localized buyer-facing WhatsApp prefill — traced to spec AC-3 / AC-8. */
export function formatWhatsAppOrderMessage(lines: WhatsAppOrderMessageLines): string {
  const { locale } = lines;

  const intro =
    locale === "fr"
      ? "Bonjour, je souhaite commander :"
      : locale === "ru"
        ? "Здравствуйте, хочу оформить заказ:"
        : "Hello, I would like to order:";

  const productLabel =
    locale === "fr" ? "Produit" : locale === "ru" ? "Товар" : "Product";
  const lengthLabel =
    locale === "fr" ? "Longueur" : locale === "ru" ? "Длина" : "Length";
  const sizeLabel =
    locale === "fr" ? "Taille" : locale === "ru" ? "Размер" : "Size";
  const priceLabel =
    locale === "fr" ? "Prix" : locale === "ru" ? "Цена" : "Price";
  const nameLabel =
    locale === "fr" ? "Nom" : locale === "ru" ? "Имя" : "Name";
  const phoneLabel =
    locale === "fr" ? "Tél" : locale === "ru" ? "Тел" : "Phone";
  const emailLabel = "Email";

  const parts = [
    intro,
    "",
    `${productLabel}: ${lines.productName} (${lines.productSlug})`,
  ];

  if (lines.length) {
    parts.push(`${lengthLabel}: ${getLengthLabel(locale, lines.length)}`);
  }

  if (lines.size) {
    parts.push(`${sizeLabel}: ${lines.size}`);
  }

  parts.push(`${priceLabel}: ${lines.priceEur} €`);
  parts.push("");
  parts.push(`${nameLabel}: ${lines.customerName}`);
  parts.push(`${phoneLabel}: ${lines.customerPhone}`);

  if (lines.customerEmail?.trim()) {
    parts.push(`${emailLabel}: ${lines.customerEmail.trim()}`);
  }

  return parts.join("\n");
}
