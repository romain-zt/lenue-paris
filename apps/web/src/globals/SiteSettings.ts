import type { GlobalConfig } from "payload";
import { ADMIN_GROUPS } from "@/i18n/admin-labels";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: {
    en: "Site settings",
    fr: "Paramètres du site",
    ru: "Настройки сайта",
  },
  admin: {
    group: ADMIN_GROUPS.editorial,
    description: {
      en: "Global brand settings — social links, contact details, brand identity.",
      fr: "Paramètres globaux de la marque — réseaux sociaux, contact, identité.",
      ru: "Глобальные настройки бренда — соцсети, контакты, идентичность.",
    },
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "brandName",
      type: "text",
      required: true,
      defaultValue: "Lénue Paris",
      label: { en: "Brand name", fr: "Nom de la marque", ru: "Название бренда" },
      admin: {
        description: {
          en: "Displayed in the header wordmark and page titles.",
          fr: "Affiché dans le header et les titres de pages.",
          ru: "Отображается в шапке сайта и заголовках страниц.",
        },
      },
    },
    {
      name: "instagramUrl",
      type: "text",
      label: { en: "Instagram URL", fr: "URL Instagram", ru: "URL Instagram" },
      admin: {
        description: {
          en: "Full URL — e.g. https://www.instagram.com/yourhandle",
          fr: "URL complète — ex. https://www.instagram.com/votrecompte",
          ru: "Полный URL — напр. https://www.instagram.com/yourhandle",
        },
      },
    },
    {
      name: "whatsappPhone",
      type: "text",
      label: { en: "WhatsApp number", fr: "Numéro WhatsApp", ru: "Номер WhatsApp" },
      admin: {
        description: {
          en: "International format without + or spaces — e.g. 33612345678",
          fr: "Format international sans + ni espaces — ex. 33612345678",
          ru: "Международный формат без + и пробелов — напр. 33612345678",
        },
      },
    },
  ],
};
