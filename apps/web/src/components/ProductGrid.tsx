import type { Product } from "../lib/products";
import { ProductCard } from "./ProductCard";

const GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "1.5rem 1rem",
};

// Responsive columns via inline style is limited; we use a style tag for breakpoints.
const GRID_CSS = `
  @media (min-width: 768px) { .product-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 1280px) { .product-grid { grid-template-columns: repeat(4, 1fr); } }
`;

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p style={{ color: "#777", marginTop: "3rem", textAlign: "center" }}>
        Aucun article dans cette catégorie pour le moment.
      </p>
    );
  }

  return (
    <>
      <style>{GRID_CSS}</style>
      <section
        className="product-grid"
        style={GRID_STYLE}
        aria-label="Catalogue produits"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </>
  );
}
