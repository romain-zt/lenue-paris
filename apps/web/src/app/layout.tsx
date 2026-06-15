import type { ReactNode } from "react";
import { Cormorant_Garamond, Jost } from "next/font/google";
import Link from "next/link";
import { Header } from "@/components/Header";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="bg-white font-sans text-stone-900 antialiased">
        <Header />
        {children}
        <footer className="mt-12 border-t border-stone-200 py-6">
          <nav className="mx-auto flex max-w-screen-xl flex-wrap gap-4 px-4 text-sm text-stone-500 sm:px-6">
            <Link href="/" className="transition-colors hover:text-stone-900">
              Boutique
            </Link>
            <Link href="/catalogue" className="transition-colors hover:text-stone-900">
              Catalogue
            </Link>
            <Link href="/a-propos" className="transition-colors hover:text-stone-900">
              À propos
            </Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
