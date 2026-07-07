"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { buildMultiPieceWhatsAppMessage } from "@/lib/selection/buildMultiPieceWhatsAppMessage";
import { useSelection } from "@/lib/selection/SelectionProvider";
import { buildWhatsAppUrl } from "@/lib/whatsapp/config";

type SelectionPanelProps = {
  open: boolean;
  onClose: () => void;
};

const panelEase = "ease-[cubic-bezier(0.25,0.8,0.25,1)]";

export function SelectionPanel({ open, onClose }: SelectionPanelProps) {
  const t = useTranslations("selection");
  const tOrder = useTranslations("order");
  const tProduct = useTranslations("product");
  const locale = useLocale();
  const { items, removeItem, clear } = useSelection();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    }

    setVisible(false);
    const timer = setTimeout(() => setMounted(false), 350);
    return () => clearTimeout(timer);
  }, [open]);

  const whatsAppUrl =
    items.length > 0
      ? buildWhatsAppUrl(
          buildMultiPieceWhatsAppMessage(items, locale, {
            intro: t("whatsappIntro"),
            pieceLine: ({ title, url, priceLabel, details }) =>
              details
                ? t("whatsappPieceLineWithDetails", {
                    title,
                    url,
                    details,
                    price: priceLabel,
                  })
                : t("whatsappPieceLine", { title, url, price: priceLabel }),
            formatSize: (size) => tOrder("whatsappSize", { size }),
            formatLength: (length) =>
              tOrder("whatsappLength", {
                length:
                  length === "longer" ? tProduct("lengthLong") : tProduct("lengthShort"),
              }),
          }),
        )
      : null;

  if (!mounted) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t("closePanel")}
        className={`fixed inset-0 z-[60] bg-overlay transition-opacity duration-200 ${panelEase} motion-reduce:!transition-none ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="selection-panel-title"
        className={`fixed bottom-0 left-0 right-0 z-[70] max-h-[85vh] overflow-y-auto rounded-t-lg border border-subtle bg-surface shadow-[0_-8px_32px_rgba(0,0,0,0.08)] transition-transform duration-300 ${panelEase} motion-reduce:!transition-none sm:bottom-auto sm:left-auto sm:right-4 sm:top-20 sm:max-h-[calc(100vh-6rem)] sm:w-[min(100%,22rem)] sm:rounded-lg sm:transition-[opacity,transform] sm:duration-[250ms] sm:ease-[cubic-bezier(0.25,0.8,0.25,1)] ${
          visible
            ? "translate-y-0 sm:opacity-100 sm:translate-y-0"
            : "translate-y-full sm:opacity-0 sm:-translate-y-1.5"
        }`}
      >
        <div className="flex items-center justify-between border-b border-subtle px-4 py-4 sm:px-5">
          <h2 id="selection-panel-title" className="text-sm font-medium tracking-wide text-primary">
            {t("panelTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] text-xs uppercase tracking-[0.15em] text-muted hover:text-primary"
          >
            {t("closePanel")}
          </button>
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted sm:px-5">{t("empty")}</p>
        ) : (
          <ul className="divide-subtle px-4 sm:px-5">
            {items.map((item) => (
              <li key={item.slug} className="flex items-start justify-between gap-3 border-b border-subtle py-4 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary">{item.title}</p>
                  <p className="mt-0.5 text-sm text-subtle">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    }).format(item.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.slug)}
                  className="shrink-0 min-h-[44px] px-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted hover:text-primary"
                >
                  {t("remove")}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-3 border-t border-subtle px-4 py-4 sm:px-5">
          {items.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="min-h-[44px] w-full text-[10px] font-medium uppercase tracking-[0.15em] text-subtle hover:text-secondary"
            >
              {t("clearAll")}
            </button>
          )}
          {whatsAppUrl && items.length > 0 && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] w-full items-center justify-center bg-accent px-6 py-3 text-sm font-semibold tracking-wide text-accent-text transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {t("continueWhatsApp")}
            </a>
          )}
        </div>
      </aside>
    </>
  );
}

type SelectionPillProps = {
  overlayMode?: boolean;
};

export function SelectionPill({ overlayMode = false }: SelectionPillProps) {
  const t = useTranslations("selection");
  const { count, isPanelOpen, openPanel, closePanel } = useSelection();

  if (count === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        aria-label={t("pillCount", { count })}
        aria-haspopup="dialog"
        aria-expanded={isPanelOpen}
        className={`relative flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors ${
          overlayMode ? "text-white/80 hover:text-white" : "text-muted hover:text-primary"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.4}
          stroke="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
          />
        </svg>
        <span
          className={`absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold leading-none ${
            overlayMode ? "bg-white text-primary" : "bg-accent text-accent-text"
          }`}
          aria-hidden="true"
        >
          {count}
        </span>
      </button>
      <SelectionPanel open={isPanelOpen} onClose={closePanel} />
    </>
  );
}
