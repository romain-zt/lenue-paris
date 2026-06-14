import { notFound } from "next/navigation";
import type { Product } from "@/types/product";
import { ProductGallery } from "@/components/product/ProductGallery";
import { OrderCTA } from "@/components/product/OrderCTA";
import Link from "next/link";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<Product | null> {
  const cmsUrl = process.env.CMS_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(
      `${cmsUrl}/api/products?where[slug][equals]=${encodeURIComponent(slug)}&where[_status][equals]=published&limit=1&locale=fr&depth=1`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { docs: Product[] };
    return data.docs?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return { title: "Produit introuvable — Lénue Paris" };
  }
  return {
    title: `${product.title} — Lénue Paris`,
    description: product.description ?? `Découvrez ${product.title} sur Lénue Paris.`,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const formattedPrice = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(product.price);

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6">
        <Link
          href="/catalogue"
          className="text-sm text-stone-500 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
        >
          ← Collection
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
        <ProductGallery
          mainImage={product.mainImage}
          gallery={product.gallery}
          title={product.title}
        />

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
              {product.title}
            </h1>
            <p className="mt-2 text-xl text-stone-700">{formattedPrice}</p>
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed text-stone-600">{product.description}</p>
          )}

          <OrderCTA product={product} />
        </div>
      </div>
    </main>
  );
}
