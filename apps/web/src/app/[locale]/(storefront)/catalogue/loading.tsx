import { getTranslations } from "next-intl/server";
import { CatalogueGridSkeleton } from "@/components/skeletons/CatalogueGridSkeleton";

export default async function CatalogueLoading() {
  const t = await getTranslations("catalogue");

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 h-8 w-40 animate-pulse rounded bg-skeleton sm:w-48" />
      <CatalogueGridSkeleton ariaLabel={t("loading")} />
    </main>
  );
}
