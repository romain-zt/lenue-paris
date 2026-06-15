import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Lénue Paris",
  description: "Robes, sacs et foulards de luxe.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-white text-stone-900 antialiased">
        {children}
        <footer className="mt-12 border-t border-stone-200 py-6">
          <nav className="mx-auto flex max-w-screen-xl flex-wrap gap-4 px-4 text-sm text-stone-500 sm:px-6">
            <a href="/" className="transition-colors hover:text-stone-900">
              Boutique
            </a>
            <a href="/catalogue" className="transition-colors hover:text-stone-900">
              Catalogue
            </a>
            <a href="/a-propos" className="transition-colors hover:text-stone-900">
              À propos
            </a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
