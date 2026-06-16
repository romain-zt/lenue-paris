import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";
import { getProductMainImageUrl } from "@/lib/productImages";
import { FeaturedProductItem, FeaturedProductsScroll } from "@/components/home/FeaturedProductsScroll";
import type { FeaturedProductsBlockProps } from "@/lib/cms/types";

function FeaturedProductCard({
  product,
  formattedPrice,
  outOfStockBadge,
}: {
  product: Product;
  formattedPrice: string;
  outOfStockBadge: string;
}) {
  const imageUrl = getProductMainImageUrl(product.slug, product.mainImage?.url);
  const isOutOfStock = product.inStock === false;

  return (
    <Link href={`/produits/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f0ebe4]">
        {isOutOfStock && (
          <span className="absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] bg-white/95 px-2.5 py-1 text-[9px] font-medium uppercase leading-snug tracking-[0.12em] text-stone-800 shadow-sm">
            {outOfStockBadge}
          </span>
        )}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04] ${
              isOutOfStock ? "opacity-90 saturate-[0.85]" : ""
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#f5f0ea] to-[#e8e0d6]">
            <span className="select-none font-serif text-6xl font-light text-stone-300" aria-hidden="true">
              L
            </span>
          </div>
        )}
      </div>
      <div className="mt-5 px-0.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-stone-700">{product.title}</p>
        <p className="mt-1.5 text-[11px] tracking-wide text-stone-400">{formattedPrice}</p>
      </div>
    </Link>
  );
}

export function FeaturedProductsBlock({
  season,
  title,
  viewCollectionLabel,
  viewFullCollectionLabel,
  collectionHref,
  products,
  locale,
  outOfStockBadge,
}: FeaturedProductsBlockProps) {
  const priceFormatter = (price: number) => formatPrice(price, locale);
  const collectionLink = collectionHref ?? "/catalogue";

  return (
    <section
      data-maison="catalogue-grid"
      aria-labelledby="featured-heading"
      className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-14 flex items-end justify-between border-b border-stone-100 pb-6 sm:mb-16">
          <div>
            {season ? (
              <p className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.35em] text-stone-400">{season}</p>
            ) : null}
            <h2 id="featured-heading" className="font-serif text-2xl font-light text-stone-900 sm:text-3xl">
              {title}
            </h2>
          </div>
          {viewCollectionLabel ? (
            <Link
              href={collectionLink}
              className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400 transition-colors hover:text-stone-800 sm:inline-flex"
            >
              {viewCollectionLabel}
            </Link>
          ) : null}
        </div>
      </div>
      <FeaturedProductsScroll ariaLabel={title}>
        {products.map((product) => (
          <FeaturedProductItem key={product.slug}>
            <FeaturedProductCard
              product={product}
              formattedPrice={priceFormatter(product.price)}
              outOfStockBadge={outOfStockBadge}
            />
          </FeaturedProductItem>
        ))}
      </FeaturedProductsScroll>
      {viewFullCollectionLabel ? (
        <div className="mx-auto max-w-screen-xl">
          <div className="mt-14 text-center sm:hidden">
            <Link
              href={collectionLink}
              className="text-[10px] font-medium uppercase tracking-[0.25em] text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline"
            >
              {viewFullCollectionLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
