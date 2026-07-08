import { getTranslations } from "next-intl/server";

export default async function BrandPageLoading() {
  const t = await getTranslations("error");

  return (
    <main
      role="status"
      aria-label={t("loading")}
      data-testid="loading-skeleton"
      className="min-h-screen animate-pulse"
    >
      <div className="aspect-video w-full bg-skeleton sm:aspect-[21/9]" />

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <div className="h-9 w-2/3 rounded bg-skeleton" />
        <div className="h-5 w-full rounded bg-skeleton" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-skeleton" />
          <div className="h-4 w-full rounded bg-skeleton" />
          <div className="h-4 w-5/6 rounded bg-skeleton" />
        </div>
      </div>
    </main>
  );
}
