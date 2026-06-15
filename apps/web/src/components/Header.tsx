"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LEFT = [
  { href: "/catalogue?categorie=robes", label: "Robes" },
  { href: "/catalogue?categorie=sacs", label: "Sacs" },
];

const NAV_RIGHT = [
  { href: "/catalogue?categorie=foulards", label: "Foulards" },
  { href: "/catalogue", label: "Collection" },
];

const ALL_NAV = [...NAV_LEFT, ...NAV_RIGHT];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/96 backdrop-blur-sm">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-[72px]">

          {/* Left nav — desktop only */}
          <nav
            className="hidden flex-1 items-center gap-7 md:flex"
            aria-label="Navigation gauche"
          >
            {NAV_LEFT.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-400 transition-colors hover:text-stone-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Logo — stacked brand mark */}
          <Link
            href="/"
            className="flex flex-col items-center leading-none"
            aria-label="Lénue Paris — Accueil"
          >
            <span className="font-serif text-xl tracking-[0.42em] text-stone-900 sm:text-2xl">
              LÉNUE
            </span>
            <span className="mt-0.5 font-serif text-[9px] tracking-[0.62em] text-stone-400 sm:text-[10px]">
              PARIS
            </span>
          </Link>

          {/* Right nav — desktop only */}
          <nav
            className="hidden flex-1 items-center justify-end gap-7 md:flex"
            aria-label="Navigation droite"
          >
            {NAV_RIGHT.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-400 transition-colors hover:text-stone-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-stone-500 md:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {open ? (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {open && (
          <nav
            id="mobile-nav"
            className="border-t border-stone-100 py-2 md:hidden"
            aria-label="Menu mobile"
          >
            {ALL_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block border-b border-stone-100 px-1 py-4 text-xs font-medium uppercase tracking-[0.2em] text-stone-600 last:border-0 hover:text-stone-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
