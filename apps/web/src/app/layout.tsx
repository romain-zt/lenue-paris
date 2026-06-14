import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Lénue Paris",
  description: "Robes, sacs et foulards de luxe.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-white text-stone-900 antialiased">{children}</body>
    </html>
  );
}
