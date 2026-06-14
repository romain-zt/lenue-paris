import { ProductCardSkeleton } from "./ProductCardSkeleton";

export function ProductGridSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "1.5rem 1rem",
      }}
      aria-busy="true"
      aria-label="Chargement du catalogue"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
