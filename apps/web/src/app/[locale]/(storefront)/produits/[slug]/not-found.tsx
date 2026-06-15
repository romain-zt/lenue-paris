import { Link } from "@/i18n/navigation";

export default function ProductNotFound() {
  return (
    <main className="mx-auto max-w-screen-xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-widest text-stone-400">Introuvable</p>
      <h1 className="mt-3 text-2xl font-semibold text-stone-900 sm:text-3xl">
        Ce produit n&apos;existe pas
      </h1>
      <p className="mt-3 text-sm text-stone-500">
        Il a peut-être été retiré ou l&apos;adresse est incorrecte.
      </p>
      <Link
        href="/catalogue"
        className="mt-8 inline-flex min-h-[44px] items-center border border-stone-900 px-6 py-2 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
      >
        Retour à la collection
      </Link>
    </main>
  );
}
