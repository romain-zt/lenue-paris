import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.mainImage?.url ?? null;

  const formattedPrice = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(product.price);

  return (
    <Link
      href={`/produits/${product.slug}`}
      className="group block"
      aria-label={product.title}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.mainImage?.alt ?? product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-stone-50 to-stone-200 transition-transform duration-700 group-hover:scale-[1.02]">
            <span
              className="select-none font-serif text-7xl font-light text-stone-300"
              aria-hidden="true"
            >
              L
            </span>
            <span
              className="mt-1 select-none text-[8px] tracking-[0.4em] text-stone-400"
              aria-hidden="true"
            >
              LÉNUE
            </span>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1 px-0.5">
        <p className="text-sm font-medium leading-snug text-stone-900">
          {product.title}
        </p>
        <p className="text-sm font-light text-stone-400">{formattedPrice}</p>
      </div>
    </Link>
  );
}
