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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Light-on-hero only at home top with menu closed
  const overlayMode = isHome && !scrolled && !open;

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
    overlayMode
      ? "text-white/70 hover:text-white"
      : "text-stone-500 hover:text-stone-900"
  }`;

  const softEase = "ease-[cubic-bezier(0.25,0.8,0.25,1)]";
  const cardDuration = "duration-[650ms]";
  const cardRowHeight = "3.75rem";

  return (
    <>
      <header
        className={[
          `sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-[400ms] ${softEase}`,
          overlayMode
            ? "border-b border-white/15 bg-transparent"
            : "border-b border-stone-200 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
        ].join(" ")}
      >
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between md:h-[72px]">
            <nav className="hidden flex-1 items-center gap-7 md:flex" aria-label={t("leftNav")}>
              {navLeft.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/"
              className="flex flex-col items-center leading-none"
              aria-label={t("home")}
            >
              <span
                className={`font-serif text-xl tracking-[0.42em] transition-colors duration-300 sm:text-2xl ${
                  overlayMode ? "text-white" : "text-stone-900"
                }`}
              >
                LÉNUE
              </span>
              <span
                className={`mt-0.5 font-serif text-[9px] tracking-[0.62em] transition-colors duration-300 sm:text-[10px] ${
                  overlayMode ? "text-white/60" : "text-stone-400"
                }`}
              >
                PARIS
              </span>
            </Link>

            <nav className="hidden flex-1 items-center justify-end gap-7 md:flex" aria-label={t("rightNav")}>
              {navRight.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ))}

              <div
                className={`flex items-center gap-1.5 border-l pl-5 transition-colors duration-300 ${
                  overlayMode ? "border-white/20" : "border-stone-200"
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
                        ? overlayMode
                          ? "text-white"
                          : "text-stone-900"
                        : overlayMode
                          ? "text-white/40 hover:text-white/80"
                          : "text-stone-300 hover:text-stone-600"
                    }`}
                  >
                    {tLocale(l as "fr" | "en" | "ru")}
                  </button>
                ))}
              </div>
            </nav>

            <button
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors duration-[400ms] ${softEase} md:hidden ${
                overlayMode ? "text-white hover:text-white/80" : "text-stone-800 hover:text-stone-600"
              }`}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? t("closeMenu") : t("openMenu")}
            >
              <span className="relative block h-[18px] w-5" aria-hidden="true">
                <span
                  className={`absolute left-0 top-0 h-px w-5 bg-current transition-all duration-[400ms] ${softEase} ${
                    open ? "translate-y-[8px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-[8px] h-px w-5 bg-current transition-all duration-300 ${softEase} ${
                    open ? "scale-x-0 opacity-0" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-[17px] h-px w-5 bg-current transition-all duration-[400ms] ${softEase} ${
                    open ? "-translate-y-[9px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — cards dépilées top → bottom, no backdrop */}
      <nav
        id="mobile-nav"
        aria-label={t("mobileNav")}
        aria-hidden={!open}
        className={`fixed left-0 right-0 top-16 z-40 md:hidden ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {allNav.map((link, index) => (
          <div
            key={link.href}
            className={`overflow-hidden bg-white transition-[max-height] ${cardDuration} ${softEase}`}
            style={{
              maxHeight: open ? cardRowHeight : "0px",
              transitionDelay: open
                ? `${index * 70}ms`
                : `${(allNav.length - 1 - index) * 40}ms`,
            }}
          >
            <Link
              href={link.href}
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              className="block border-b border-stone-100 px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-stone-700 hover:bg-stone-50/60 hover:text-stone-900"
            >
              {link.label}
            </Link>
          </div>
        ))}

        <div
          className={`overflow-hidden bg-white transition-[max-height] ${cardDuration} ${softEase} ${
            open ? "shadow-[0_8px_24px_rgba(0,0,0,0.04)]" : ""
          }`}
          style={{
            maxHeight: open ? cardRowHeight : "0px",
            transitionDelay: open ? `${allNav.length * 70}ms` : "0ms",
          }}
        >
          <div className="flex items-center gap-3 px-6 py-4">
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-stone-400">
              {tLocale("switchLabel")}
            </span>
            {routing.locales.map((l) => (
              <button
                key={l}
                onClick={() => {
                  switchLocale(l);
                  setOpen(false);
                }}
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
    </>
  );
}
