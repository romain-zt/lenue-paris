"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LEFT = [
  { href: "/catalogue", label: "Collection" },
  { href: "/catalogue?categorie=robes", label: "Robes" },
];

const NAV_RIGHT = [
  { href: "/catalogue?categorie=sacs", label: "Sacs" },
  { href: "/catalogue?categorie=foulards", label: "Foulards" },
];

const ALL_NAV = [...NAV_LEFT, ...NAV_RIGHT];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between md:h-16">
          {/* Left nav — desktop only */}
          <nav
            className="hidden flex-1 items-center gap-6 md:flex lg:gap-8"
            aria-label="Navigation gauche"
          >
            {NAV_LEFT.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500 transition-colors hover:text-stone-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-base tracking-[0.3em] text-stone-900 transition-colors hover:text-stone-600 sm:text-lg md:text-center"
            aria-label="Lénue Paris — Accueil"
          >
            Lénue Paris
          </Link>

          {/* Right nav — desktop only */}
          <nav
            className="hidden flex-1 items-center justify-end gap-6 md:flex lg:gap-8"
            aria-label="Navigation droite"
          >
            {NAV_RIGHT.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500 transition-colors hover:text-stone-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-stone-600 md:hidden"
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
                className="block border-b border-stone-100 px-1 py-3.5 text-sm text-stone-700 last:border-0 hover:text-stone-900"
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
