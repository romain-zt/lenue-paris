/** Two-column product tile skeleton at 375px — maison gutters, no spinner. */
export function CatalogueGridSkeleton() {
  return (
    <div
      data-maison="catalogue-grid"
      className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-8"
      aria-busy="true"
      aria-label="Chargement du catalogue"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i}>
          <div className="aspect-[3/4] animate-pulse rounded-sm bg-[#f0ebe4]" />
          <div className="mt-4 h-3 w-20 animate-pulse rounded bg-stone-100" />
          <div className="mt-2 h-3 w-14 animate-pulse rounded bg-stone-50" />
        </div>
      ))}
    </div>
  );
}
