import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import frMessages from "../../messages/fr.json";

export function WithIntl({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="fr" messages={frMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

export function renderWithIntl(
  ui: React.ReactElement,
  renderFn: (ui: React.ReactElement) => ReturnType<typeof import("@testing-library/react").render>
) {
  return renderFn(<WithIntl>{ui}</WithIntl>);
}
