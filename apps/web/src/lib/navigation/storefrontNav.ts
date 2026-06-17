/** Buyer-facing primary nav — client brief #7 (Collection · À propos · Livraison · Contact). */
export const STOREFRONT_NAV_LINKS = [
  { href: "/catalogue", labelKey: "collection" },
  { href: "/a-propos", labelKey: "about" },
  { href: "/livraison", labelKey: "delivery" },
  { href: "/contact", labelKey: "contact" },
] as const;

export type StorefrontNavHref = (typeof STOREFRONT_NAV_LINKS)[number]["href"];

export const STOREFRONT_NAV_HREFS: StorefrontNavHref[] = STOREFRONT_NAV_LINKS.map((l) => l.href);
