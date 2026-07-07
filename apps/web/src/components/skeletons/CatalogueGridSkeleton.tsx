interface CatalogueGridSkeletonProps {
  /** Translated aria-label for screen readers. Pass from a server component via getTranslations. */
  ariaLabel?: string;
}

/** Two-column product tile skeleton at 375px — maison gutters, no spinner. */
export function CatalogueGridSkeleton({ ariaLabel }: CatalogueGridSkeletonProps) {
  return (
    <div
      data-maison="catalogue-grid"
      className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-8"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i}>
          <div className="aspect-[3/4] animate-pulse rounded-sm bg-editorial" />
          <div className="mt-4 h-3 w-20 animate-pulse rounded bg-skeleton" />
          <div className="mt-2 h-3 w-14 animate-pulse rounded bg-skeleton" />
        </div>
      ))}
    </div>
  );
}
