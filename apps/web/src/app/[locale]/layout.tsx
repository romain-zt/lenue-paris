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
import { STOREFRONT_NAV_LINKS } from "@/lib/navigation/storefrontNav";

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
  const t = await getTranslations({ locale, namespace: "home" });

  return buildPageMetadata({
    title: "Lénue Paris",
    description: t("heroTagline"),
    locale,
    pathname: "",
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

  return (
    <html lang={locale} className={`${cormorant.variable} ${jost.variable}`}>
      <body className="bg-white font-sans text-stone-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <SelectionProvider>
            {isDraft && <LivePreviewListener />}
            <Header />
            {children}
          <footer data-maison="footer" className="mt-12 border-t border-stone-200 py-6">
            <nav
              className="mx-auto flex max-w-screen-xl flex-wrap items-center gap-x-6 gap-y-2 px-4 text-sm text-stone-500 sm:px-6"
              aria-label={tNav("footerNav")}
            >
              {STOREFRONT_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="min-h-[44px] py-2 transition-colors hover:text-stone-900"
                >
                  {tNav(link.labelKey)}
                </Link>
              ))}
              <a
                href="https://www.instagram.com/alisa.inwonderland.21"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="ml-auto flex min-h-[44px] items-center py-2 transition-colors hover:text-stone-900"
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
            </nav>
          </footer>
          </SelectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
