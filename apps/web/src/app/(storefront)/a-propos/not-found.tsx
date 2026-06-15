export default function BrandPageNotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <p className="text-base text-stone-600 sm:text-lg">Cette page est introuvable.</p>
      <a
        href="/"
        className="mt-8 inline-flex min-h-[44px] items-center text-sm text-stone-500 transition-colors hover:text-stone-900"
      >
        ← Retour à la boutique
      </a>
    </main>
  );
}
