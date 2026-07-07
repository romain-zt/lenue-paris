/** Maison-shaped home loading surface — mirrors HeroBlock + featured carousel hooks. */
export function HomePageSkeleton() {
  return (
    <main aria-busy="true">
      <section
        data-maison="hero-skeleton"
        className="relative -mt-16 h-[100svh] min-h-[100dvh] overflow-hidden bg-secondary md:-mt-[72px]"
      >
        <div className="absolute inset-0 animate-pulse bg-accent" data-maison="hero-skeleton-image" />
        <div className="absolute bottom-0 left-0 space-y-4 px-6 py-10 sm:px-10 sm:py-14">
          <div className="h-3 w-28 animate-pulse rounded bg-white/20" />
          <div className="h-12 w-48 animate-pulse rounded bg-white/15 sm:h-14 sm:w-56" />
          <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
        </div>
      </section>

      <section className="bg-section px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-xl space-y-4">
          <div className="mx-auto h-5 w-4/5 animate-pulse rounded bg-skeleton" />
          <div className="mx-auto h-5 w-3/5 animate-pulse rounded bg-skeleton" />
        </div>
      </section>

      <section
        data-maison="catalogue-grid"
        className="bg-surface px-4 py-20 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-14 border-b border-subtle pb-6">
            <div className="mb-2 h-3 w-24 animate-pulse rounded bg-skeleton" />
            <div className="h-8 w-48 animate-pulse rounded bg-skeleton sm:w-56" />
          </div>
        </div>
        <div className="flex gap-8 overflow-hidden px-4 sm:gap-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-[min(72vw,340px)] shrink-0"
            >
              <div className="aspect-[3/4] animate-pulse rounded-sm bg-editorial" />
              <div className="mt-5 h-3 w-24 animate-pulse rounded bg-skeleton" />
              <div className="mt-2 h-3 w-16 animate-pulse rounded bg-skeleton" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
