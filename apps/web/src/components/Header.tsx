"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function Header() {
  const t = useTranslations("nav");
  const tLocale = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLeft = [
    { href: "/catalogue?categorie=robes" as const, label: t("dresses") },
    { href: "/catalogue?categorie=sacs" as const, label: t("bags") },
  ];

  const navRight = [
    { href: "/catalogue?categorie=foulards" as const, label: t("scarfs") },
    { href: "/catalogue" as const, label: t("collection") },
  ];

  const allNav = [...navLeft, ...navRight];

  function switchLocale(next: string) {
    router.replace(pathname, { locale: next });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/96 backdrop-blur-sm">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-[72px]">

          {/* Left nav — desktop only */}
          <nav className="hidden flex-1 items-center gap-7 md:flex" aria-label={t("leftNav")}>
            {navLeft.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-400 transition-colors hover:text-stone-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Logo */}
          <Link
            href="/"
            className="flex flex-col items-center leading-none"
            aria-label={t("home")}
          >
            <span className="font-serif text-xl tracking-[0.42em] text-stone-900 sm:text-2xl">
              LÉNUE
            </span>
            <span className="mt-0.5 font-serif text-[9px] tracking-[0.62em] text-stone-400 sm:text-[10px]">
              PARIS
            </span>
          </Link>

          {/* Right nav — desktop only */}
          <nav className="hidden flex-1 items-center justify-end gap-7 md:flex" aria-label={t("rightNav")}>
            {navRight.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-400 transition-colors hover:text-stone-800"
              >
                {link.label}
              </Link>
            ))}

            {/* Locale switcher — desktop */}
            <div className="flex items-center gap-1.5 border-l border-stone-200 pl-5" aria-label={tLocale("switchLabel")}>
              {routing.locales.map((l) => (
                <button
                  key={l}
                  onClick={() => switchLocale(l)}
                  aria-current={locale === l ? "true" : undefined}
                  className={`text-[9px] font-medium uppercase tracking-[0.18em] transition-colors min-h-[44px] px-1 ${
                    locale === l
                      ? "text-stone-900"
                      : "text-stone-300 hover:text-stone-600"
                  }`}
                >
                  {tLocale(l as "fr" | "en" | "ru")}
                </button>
              ))}
            </div>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-stone-500 md:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("closeMenu") : t("openMenu")}
          >
            {open ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {open && (
          <nav
            id="mobile-nav"
            className="border-t border-stone-100 py-2 md:hidden"
            aria-label={t("mobileNav")}
          >
            {allNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block border-b border-stone-100 px-1 py-4 text-xs font-medium uppercase tracking-[0.2em] text-stone-600 last:border-0 hover:text-stone-900"
              >
                {link.label}
              </Link>
            ))}

            {/* Locale switcher — mobile */}
            <div className="flex items-center gap-3 border-t border-stone-100 px-1 py-4">
              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-stone-300">
                {tLocale("switchLabel")}
              </span>
              {routing.locales.map((l) => (
                <button
                  key={l}
                  onClick={() => { switchLocale(l); setOpen(false); }}
                  aria-current={locale === l ? "true" : undefined}
                  className={`min-h-[44px] px-2 text-xs font-medium uppercase tracking-[0.15em] transition-colors ${
                    locale === l ? "text-stone-900" : "text-stone-400 hover:text-stone-700"
                  }`}
                >
                  {tLocale(l as "fr" | "en" | "ru")}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
