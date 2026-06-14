import type { ReactNode } from "react";

export const metadata = {
  title: "Lénue Paris",
  description: "Luxury fashion boutique — dresses, bags & scarfs",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fafaf9" }}>
        {children}
      </body>
    </html>
  );
}
