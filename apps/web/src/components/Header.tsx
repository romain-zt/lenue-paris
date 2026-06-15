"use client";

import { useState, useEffect } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Header is transparent only when at the top of the home page and menu is closed
  const transparent = isHome && !scrolled && !open;

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

  const linkClass = `text-[10px] font-medium uppercase tracking-[0.22em] transition-colors duration-300 ${
    transparent
      ? "text-white/60 hover:text-white"
      : "text-stone-400 hover:text-stone-800"
  }`;

  return (
    <header
      className={[
        "sticky top-0 z-50 will-change-[background-color,border-color] transition-[background-color,border-color,box-shadow] duration-500 ease-out",
        transparent
          ? "border-b border-white/10 bg-transparent"
          : "border-b border-stone-200/70 bg-white/97 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]",
      ].join(" ")}
    >
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-[72px]">

          {/* Left nav — desktop only */}
          <nav className="hidden flex-1 items-center gap-7 md:flex" aria-label={t("leftNav")}>
            {navLeft.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
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
            <span
              className={`font-serif text-xl tracking-[0.42em] transition-colors duration-500 sm:text-2xl ${
                transparent ? "text-white" : "text-stone-900"
              }`}
            >
              LÉNUE
            </span>
            <span
              className={`mt-0.5 font-serif text-[9px] tracking-[0.62em] transition-colors duration-500 sm:text-[10px] ${
                transparent ? "text-white/50" : "text-stone-400"
              }`}
            >
              PARIS
            </span>
          </Link>

          {/* Right nav — desktop only */}
          <nav className="hidden flex-1 items-center justify-end gap-7 md:flex" aria-label={t("rightNav")}>
            {navRight.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}

            {/* Locale switcher — desktop */}
            <div
              className={`flex items-center gap-1.5 border-l pl-5 transition-colors duration-500 ${
                transparent ? "border-white/20" : "border-stone-200"
              }`}
              aria-label={tLocale("switchLabel")}
            >
              {routing.locales.map((l) => (
                <button
                  key={l}
                  onClick={() => switchLocale(l)}
                  aria-current={locale === l ? "true" : undefined}
                  className={`min-h-[44px] px-1 text-[9px] font-medium uppercase tracking-[0.18em] transition-colors duration-300 ${
                    locale === l
                      ? transparent ? "text-white" : "text-stone-900"
                      : transparent
                        ? "text-white/30 hover:text-white/70"
                        : "text-stone-300 hover:text-stone-600"
                  }`}
                >
                  {tLocale(l as "fr" | "en" | "ru")}
                </button>
              ))}
            </div>
          </nav>

          {/* Mobile hamburger — animates to × */}
          <button
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors duration-300 md:hidden ${
              transparent ? "text-white/80 hover:text-white" : "text-stone-500 hover:text-stone-900"
            }`}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("closeMenu") : t("openMenu")}
          >
            <span className="relative block h-[18px] w-5" aria-hidden="true">
              <span
                className={`absolute left-0 top-0 h-px w-5 bg-current transition-all duration-300 ${
                  open ? "translate-y-[8px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[8px] h-px w-5 bg-current transition-all duration-200 ${
                  open ? "scale-x-0 opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[17px] h-px w-5 bg-current transition-all duration-300 ${
                  open ? "-translate-y-[9px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>

        {/* Mobile nav — smooth slide */}
        <nav
          id="mobile-nav"
          aria-label={t("mobileNav")}
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out md:hidden ${
            open ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className={`border-t py-2 ${transparent ? "border-white/10" : "border-stone-100"}`}>
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
          </div>
        </nav>
      </div>
    </header>
  );
}
