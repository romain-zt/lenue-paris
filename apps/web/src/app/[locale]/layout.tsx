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
  const t = await getTranslations("footer");
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
            <nav className="mx-auto flex max-w-screen-xl flex-wrap gap-4 px-4 text-sm text-stone-500 sm:px-6">
              <Link href="/" className="transition-colors hover:text-stone-900">
                {t("boutique")}
              </Link>
              <Link href="/catalogue" className="transition-colors hover:text-stone-900">
                {t("catalogue")}
              </Link>
              <Link href="/a-propos" className="transition-colors hover:text-stone-900">
                {t("about")}
              </Link>
            </nav>
          </footer>
          </SelectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
