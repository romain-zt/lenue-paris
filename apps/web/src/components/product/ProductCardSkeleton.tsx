export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="aspect-[3/4] bg-skeleton rounded-sm" />
      <div className="mt-2 space-y-1.5 px-0.5">
        <div className="h-4 w-3/4 rounded bg-skeleton" />
        <div className="h-4 w-1/3 rounded bg-skeleton" />
      </div>
    </div>
  );
}
