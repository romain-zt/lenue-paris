"use client";

import { EditableField } from "@/components/cms/EditableField";
import type { ContentLocale } from "@/lib/cms/types";

type HomeQuoteSectionProps = {
  quote: string;
  docId?: string;
  locale?: ContentLocale;
};

export function HomeQuoteSection({ quote, docId, locale }: HomeQuoteSectionProps) {
  const canEdit = Boolean(docId);

  return (
    <section aria-label="Philosophie" className="bg-[#f5f0ea] px-4 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-serif text-xl font-light italic leading-relaxed text-stone-600 sm:text-2xl sm:leading-relaxed">
          {canEdit ? (
            <EditableField
              collection="pages"
              id={docId!}
              field="philosophyQuote"
              fieldLabel="Citation philosophie"
              currentValue={quote}
              locale={locale}
              multiline
            >
              {quote}
            </EditableField>
          ) : (
            quote
          )}
        </p>
        <div className="mx-auto mt-7 h-px w-10 bg-stone-300" aria-hidden="true" />
      </div>
    </section>
  );
}
