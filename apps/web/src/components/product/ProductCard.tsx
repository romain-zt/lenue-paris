import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.mainImage?.url ?? "/placeholder.png";
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
        <Image
          src={imageUrl}
          alt={product.mainImage?.alt ?? product.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="mt-2 space-y-0.5 px-0.5">
        <p className="text-sm font-medium text-stone-900 leading-snug">
          {product.title}
        </p>
        <p className="text-sm text-stone-500">{formattedPrice}</p>
      </div>
    </Link>
  );
}
