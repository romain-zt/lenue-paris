import type { ReactNode } from "react";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata = {
  title: "Lénue Paris",
  description: "Robes, sacs et foulards de luxe.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="bg-white font-sans text-stone-900 antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
