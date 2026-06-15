export default function ProductDetailLoading() {
  return (
    <main className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-4 w-24 animate-pulse rounded bg-stone-200" />

      <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
        <div className="aspect-[3/4] w-full animate-pulse rounded bg-stone-100" />

        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <div className="h-7 w-3/4 animate-pulse rounded bg-stone-200" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-stone-100" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-stone-100" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-stone-100" />
          </div>
          <div className="h-12 w-full animate-pulse rounded bg-stone-200" />
        </div>
      </div>
    </main>
  );
}
