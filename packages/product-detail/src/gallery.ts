import type { PayloadProductDetailDoc } from "./payload-doc";
import type { ProductGalleryImage } from "./types";

function resolveImageUrl(
  image: { url?: string | null } | string | null | undefined,
): string | null {
  if (!image) {
    return null;
  }
  if (typeof image === "string") {
    return image;
  }
  return image.url ?? null;
}

export function resolveGalleryImages(
  doc: Pick<PayloadProductDetailDoc, "name" | "images">,
): ProductGalleryImage[] {
  const images = doc.images ?? [];
  const gallery: ProductGalleryImage[] = [];

  for (const [index, entry] of images.entries()) {
    const url = resolveImageUrl(entry.image);
    if (!url) {
      continue;
    }

    gallery.push({
      id: entry.id != null ? String(entry.id) : `image-${index}`,
      url,
      alt: doc.name,
    });
  }

  return gallery;
}
