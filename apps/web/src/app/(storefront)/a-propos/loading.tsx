export default function BrandPageLoading() {
  return (
    <main
      role="status"
      aria-label="Chargement"
      data-testid="loading-skeleton"
      className="animate-pulse"
    >
      <div className="aspect-video w-full bg-stone-200 sm:aspect-[21/9]" />

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <div className="h-9 w-2/3 rounded bg-stone-200" />
        <div className="h-5 w-full rounded bg-stone-200" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-stone-200" />
          <div className="h-4 w-full rounded bg-stone-200" />
          <div className="h-4 w-5/6 rounded bg-stone-200" />
        </div>
      </div>
    </main>
  );
}
