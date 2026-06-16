export function HomeEmptyState() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-[#f5f0ea] px-6">
      <div className="max-w-md text-center" data-testid="home-empty-state">
        <p className="font-serif text-2xl font-light text-stone-700">Lénue Paris</p>
        <p className="mt-4 text-sm leading-relaxed text-stone-500">
          La page d&apos;accueil n&apos;est pas encore publiée dans le CMS. Lancez{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs">pnpm --filter web seed</code> pour initialiser le
          contenu.
        </p>
      </div>
    </main>
  );
}
