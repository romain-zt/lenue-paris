import type { DressLength, DressSize } from "@/types/product";

export type SelectionItem = {
  slug: string;
  title: string;
  price: number;
  size?: DressSize | null;
  length?: DressLength | null;
};

export type SelectionMessageLabels = {
  intro: string;
  pieceLine: (params: {
    title: string;
    url: string;
    priceLabel: string;
    details?: string;
  }) => string;
  formatSize?: (size: DressSize) => string;
  formatLength?: (length: DressLength) => string;
};
