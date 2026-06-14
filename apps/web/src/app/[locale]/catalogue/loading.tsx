import { CatalogueGridSkeleton } from "@/components/catalogue/CatalogueGrid";
import styles from "@/components/catalogue/catalogue.module.css";

export default function CatalogueLoading() {
  return (
    <main className={styles.page} aria-busy="true">
      <header className={styles.header}>
        <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
        <div className={styles.filters}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={styles.chip}>
              <div
                className={styles.skeletonLine}
                style={{ width: "4rem", margin: "0 auto" }}
              />
            </div>
          ))}
        </div>
      </header>
      <CatalogueGridSkeleton />
    </main>
  );
}
