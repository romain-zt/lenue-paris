"use client";

import { Link } from "@/i18n/navigation";
import { EditableField } from "@/components/cms/EditableField";
import type { ContentLocale } from "@/lib/cms/types";

type HomeCategoryStripProps = {
  exploreLabel: string;
  categoryLinks: { href: string; label: string }[];
  docId?: string;
  locale?: ContentLocale;
};

export function HomeCategoryStrip({
  exploreLabel,
  categoryLinks,
  docId,
  locale,
}: HomeCategoryStripProps) {
  const canEdit = Boolean(docId);

  return (
    <section aria-label="Univers" className="border-t border-stone-100 bg-white">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-8 sm:gap-x-12 sm:px-6 lg:px-8">
        <span className="text-[9px] font-medium uppercase tracking-[0.35em] text-stone-300">
          {canEdit ? (
            <EditableField
              collection="pages"
              id={docId!}
              field="exploreLabel"
              fieldLabel="Libellé explorer"
              currentValue={exploreLabel}
              locale={locale}
            >
              {exploreLabel}
            </EditableField>
          ) : (
            exploreLabel
          )}
        </span>
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
