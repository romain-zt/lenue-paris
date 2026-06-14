import { ProductDetailSkeleton } from "@/components/product-detail/ProductDetailView";
import styles from "@/components/product-detail/pdp.module.css";

export default function ProductLoadingPage() {
  return (
    <main className={styles.page}>
      <ProductDetailSkeleton />
    </main>
  );
}
