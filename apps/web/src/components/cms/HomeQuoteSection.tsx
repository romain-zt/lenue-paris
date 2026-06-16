import { getTranslations } from "next-intl/server";

export async function HomeQuoteSection() {
  const t = await getTranslations("home");

  return (
    <section aria-label="Philosophie" className="bg-[#f5f0ea] px-4 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-serif text-xl font-light italic leading-relaxed text-stone-600 sm:text-2xl sm:leading-relaxed">
          {t("quote")}
        </p>
        <div className="mx-auto mt-7 h-px w-10 bg-stone-300" aria-hidden="true" />
      </div>
    </section>
  );
}
