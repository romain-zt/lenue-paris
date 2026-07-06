import type { ReactNode } from "react";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { LivePreviewListener } from "@/components/cms/LivePreviewListener";
import { SelectionProvider } from "@/lib/selection/SelectionProvider";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteSettings, resolveBrandName, resolveWordmarkPrimary, resolveWordmarkSecondary } from "@/lib/cms/siteSettings";
import { STOREFRONT_NAV_LINKS } from "@/lib/navigation/storefrontNav";
import { SiteBrandProvider } from "@/lib/site/SiteBrandProvider";
import { PublicAdminFAB } from "@/components/cms/PublicAdminFAB";
import { TokenInjector } from "@/components/cms/TokenInjector";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const [t, siteSettings] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getSiteSettings(),
  ]);
  const brandName = resolveBrandName(siteSettings);

  return buildPageMetadata({
    title: brandName,
    description: t("heroTagline"),
    locale,
    pathname: "",
    siteName: brandName,
  });
}

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const tNav = await getTranslations("nav");
  const { isEnabled: isDraft } = await draftMode();
  const siteSettings = await getSiteSettings();
  const siteBrand = {
    brandName: resolveBrandName(siteSettings),
    wordmarkPrimary: resolveWordmarkPrimary(siteSettings),
    wordmarkSecondary: resolveWordmarkSecondary(siteSettings),
  };

  return (
    <html lang={locale} className={`${cormorant.variable} ${jost.variable}`}>
      <head>
        <TokenInjector />
      </head>
      <body className="font-sans text-primary antialiased" style={{ backgroundColor: "var(--color-page-bg)" }}>
        <NextIntlClientProvider messages={messages}>
          <SiteBrandProvider value={siteBrand}>
          <SelectionProvider>
            {isDraft && <LivePreviewListener />}
            <Header />
            {children}
          <footer data-maison="footer" className="mt-12 border-t border-subtle py-6">
            <nav
              className="mx-auto flex max-w-screen-xl flex-wrap items-center gap-x-6 gap-y-2 px-4 text-sm text-muted sm:px-6"
              aria-label={tNav("footerNav")}
            >
              {STOREFRONT_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="min-h-[44px] py-2 transition-colors hover:text-primary"
                >
                  {tNav(link.labelKey)}
                </Link>
              ))}
              <div className="ml-auto flex items-center gap-3">
                <a
                  href={`https://wa.me/${siteSettings.whatsappPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex min-h-[44px] items-center py-2 transition-colors hover:text-primary"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
                <a
                  href={siteSettings.instagramUrl ?? "https://www.instagram.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex min-h-[44px] items-center py-2 transition-colors hover:text-primary"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                  </svg>
                </a>
              </div>
            </nav>
          </footer>
          <PublicAdminFAB />
          </SelectionProvider>
          </SiteBrandProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
