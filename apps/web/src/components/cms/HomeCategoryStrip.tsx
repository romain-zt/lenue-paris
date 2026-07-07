import { Link } from "@/i18n/navigation";

type HomeCategoryStripProps = {
  exploreLabel: string;
  categoryLinks: { href: string; label: string }[];
};

export function HomeCategoryStrip({ exploreLabel, categoryLinks }: HomeCategoryStripProps) {
  return (
    <section aria-label="Univers" className="border-t border-subtle bg-surface">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-8 sm:gap-x-12 sm:px-6 lg:px-8">
        <span className="text-[9px] font-medium uppercase tracking-[0.35em] text-subtle">{exploreLabel}</span>
        {categoryLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[10px] font-medium uppercase tracking-[0.22em] text-subtle transition-colors hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
