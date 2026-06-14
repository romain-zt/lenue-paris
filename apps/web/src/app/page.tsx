import { getProducts, type Product, type ProductCategory } from "../lib/products";
import { CategoryFilter } from "../components/CategoryFilter";
import { ProductGrid } from "../components/ProductGrid";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ category?: string }>;

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category } = await searchParams;
  const activeCategory = (category as ProductCategory) ?? null;

  let products: Product[] = [];
  let fetchError = false;

  try {
    products = await getProducts("fr");
  } catch {
    fetchError = true;
  }

  const filtered =
    activeCategory
      ? products.filter((p) => p.category === activeCategory)
      : products;

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "2rem 1rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "0.05em" }}>
          Lénue Paris
        </h1>
      </header>

      <CategoryFilter activeCategory={activeCategory} />

      {fetchError ? (
        <div role="alert" style={{ marginTop: "3rem", textAlign: "center", color: "#666" }}>
          <p>La collection ne peut pas être chargée pour le moment.</p>
          <p>
            <a href="/" style={{ color: "#333", textDecoration: "underline" }}>
              Réessayer
            </a>
          </p>
        </div>
      ) : (
        <ProductGrid products={filtered} />
      )}
    </main>
  );
}
