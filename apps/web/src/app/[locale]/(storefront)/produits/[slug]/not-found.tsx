import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function ProductNotFound() {
  const t = await getTranslations("error");

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-widest text-subtle">{t("notFound")}</p>
      <h1 className="mt-3 text-2xl font-semibold text-primary sm:text-3xl">
        {t("productNotFound")}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {t("productGone")}
      </p>
      <Link
        href="/catalogue"
        className="mt-8 inline-flex min-h-[44px] items-center border border-accent px-6 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {t("backToCollection")}
      </Link>
    </main>
  );
}
