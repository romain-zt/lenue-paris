import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function BrandPageNotFound() {
  const t = await getTranslations("error");

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <p className="text-base text-muted sm:text-lg">{t("pageNotFound")}</p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-[44px] items-center text-sm text-subtle transition-colors hover:text-primary"
      >
        {t("backToShop")}
      </Link>
    </main>
  );
}
