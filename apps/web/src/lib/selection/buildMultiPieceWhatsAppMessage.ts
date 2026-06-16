import { localePath } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/seo/metadata";
import type { SelectionItem, SelectionMessageLabels } from "./types";

export function buildMultiPieceWhatsAppMessage(
  items: SelectionItem[],
  locale: string,
  labels: SelectionMessageLabels,
): string {
  if (items.length === 0) return labels.intro;

  const base = getSiteUrl();
  const lines: string[] = [labels.intro, ""];

  for (const item of items) {
    const path = localePath(locale, `/produits/${item.slug}`);
    const url = `${base}${path}`;
    const priceLabel = `${item.price} €`;

    const detailParts: string[] = [];
    if (item.size && labels.formatSize) detailParts.push(labels.formatSize(item.size));
    if (item.length && labels.formatLength) detailParts.push(labels.formatLength(item.length));
    const details = detailParts.length > 0 ? detailParts.join(", ") : undefined;

    lines.push(
      labels.pieceLine({
        title: item.title,
        url,
        priceLabel,
        details,
      }),
    );
  }

  return lines.join("\n");
}
