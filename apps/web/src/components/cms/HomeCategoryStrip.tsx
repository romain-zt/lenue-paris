import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function HomeCategoryStrip() {
  const t = await getTranslations("home");
  const nav = await getTranslations("nav");

  const categoryLinks = [
    { href: "/catalogue?categorie=robes", label: nav("dresses") },
    { href: "/catalogue?categorie=sacs", label: nav("bags") },
    { href: "/catalogue?categorie=foulards", label: nav("scarfs") },
    { href: "/catalogue", label: t("allCollection") },
  ];

  return (
    <section aria-label="Univers" className="border-t border-stone-100 bg-white">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-8 sm:gap-x-12 sm:px-6 lg:px-8">
        <span className="text-[9px] font-medium uppercase tracking-[0.35em] text-stone-300">{t("exploreLabel")}</span>
        {categoryLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-400 transition-colors hover:text-stone-900"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
