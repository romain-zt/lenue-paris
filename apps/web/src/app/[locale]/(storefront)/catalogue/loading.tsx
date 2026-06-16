import { CatalogueGridSkeleton } from "@/components/skeletons/CatalogueGridSkeleton";

export default function CatalogueLoading() {
  return (
    <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 h-8 w-40 animate-pulse rounded bg-stone-200 sm:w-48" />
      <CatalogueGridSkeleton />
    </main>
  );
}
