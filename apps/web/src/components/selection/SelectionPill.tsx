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
        className={`fixed inset-0 z-[60] bg-stone-900/20 transition-opacity duration-200 ${panelEase} motion-reduce:!transition-none ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="selection-panel-title"
        className={`fixed bottom-0 left-0 right-0 z-[70] max-h-[85vh] overflow-y-auto rounded-t-lg border border-stone-200 bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.08)] transition-transform duration-300 ${panelEase} motion-reduce:!transition-none sm:bottom-auto sm:left-auto sm:right-4 sm:top-20 sm:max-h-[calc(100vh-6rem)] sm:w-[min(100%,22rem)] sm:rounded-lg sm:transition-[opacity,transform] sm:duration-[250ms] sm:ease-[cubic-bezier(0.25,0.8,0.25,1)] ${
          visible
            ? "translate-y-0 sm:opacity-100 sm:translate-y-0"
            : "translate-y-full sm:opacity-0 sm:-translate-y-1.5"
        }`}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-4 sm:px-5">
          <h2 id="selection-panel-title" className="text-sm font-medium tracking-wide text-stone-900">
            {t("panelTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] text-xs uppercase tracking-[0.15em] text-stone-500 hover:text-stone-900"
          >
            {t("closePanel")}
          </button>
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-8 text-sm text-stone-500 sm:px-5">{t("empty")}</p>
        ) : (
          <ul className="divide-y divide-stone-100 px-4 sm:px-5">
            {items.map((item) => (
              <li key={item.slug} className="flex items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900">{item.title}</p>
                  <p className="mt-0.5 text-sm text-stone-400">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    }).format(item.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.slug)}
                  className="shrink-0 min-h-[44px] px-2 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-500 hover:text-stone-900"
                >
                  {t("remove")}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-3 border-t border-stone-100 px-4 py-4 sm:px-5">
          {items.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="min-h-[44px] w-full text-[10px] font-medium uppercase tracking-[0.15em] text-stone-400 hover:text-stone-700"
            >
              {t("clearAll")}
            </button>
          )}
          {whatsAppUrl && items.length > 0 && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] w-full items-center justify-center bg-stone-900 px-6 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2"
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
        className={`min-h-[44px] rounded-full border px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors ${
          overlayMode
            ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
            : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-stone-100"
        }`}
        aria-haspopup="dialog"
        aria-expanded={isPanelOpen}
      >
        {t("pillCount", { count })}
      </button>
      <SelectionPanel open={isPanelOpen} onClose={closePanel} />
    </>
  );
}
