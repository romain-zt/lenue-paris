import type { Product } from "../lib/products";
import { formatPrice } from "../lib/products";

export function ProductCard({ product }: { product: Product }) {
  const firstImage = product.images?.[0]?.image;

  return (
    <a
      href={`/products/${product.slug}`}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
      }}
      aria-label={`${product.title} — ${formatPrice(product.price)}`}
    >
      <div
        style={{
          aspectRatio: "3/4",
          background: "#f0ede8",
          overflow: "hidden",
          marginBottom: "0.75rem",
        }}
      >
        {firstImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstImage.url}
            alt={firstImage.alt || product.title}
            width={firstImage.width}
            height={firstImage.height}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{ width: "100%", height: "100%", background: "#e8e4df" }}
          />
        )}
      </div>
      <p style={{ margin: "0 0 0.25rem", fontSize: "0.9rem", fontWeight: 500 }}>
        {product.title}
      </p>
      <p style={{ margin: 0, fontSize: "0.85rem", color: "#555" }}>
        {formatPrice(product.price)}
      </p>
    </a>
  );
}
