import { Link } from "@/i18n/navigation";

type HomeCategoryStripProps = {
  exploreLabel: string;
  categoryLinks: { href: string; label: string }[];
};

export function HomeCategoryStrip({ exploreLabel, categoryLinks }: HomeCategoryStripProps) {
  return (
    <section aria-label="Univers" className="border-t border-stone-100 bg-white">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-8 sm:gap-x-12 sm:px-6 lg:px-8">
        <span className="text-[9px] font-medium uppercase tracking-[0.35em] text-stone-300">{exploreLabel}</span>
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
