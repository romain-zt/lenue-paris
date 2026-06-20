"use client";

import Image from "next/image";
import type { PageCover } from "@/types/page";
import { EditableField } from "@/components/cms/EditableField";
import type { ContentLocale } from "@/lib/cms/types";

export interface BrandPageContentProps {
  title: string;
  body: string;
  cover: PageCover | null;
  docId?: string;
  locale?: ContentLocale;
}

export function BrandPageContent({ title, body, cover, docId, locale }: BrandPageContentProps) {
  const paragraphs = body.split("\n\n").filter(Boolean);
  const canEdit = Boolean(docId);

  return (
    <main>
      {cover?.url ? (
        <div className="relative aspect-video w-full overflow-hidden bg-stone-100 sm:aspect-[21/9]">
          <Image
            src={cover.url}
            alt={cover.alt ?? title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ) : (
        <header className="border-b border-stone-200 bg-stone-50 py-12 sm:py-16">
          <p className="text-center font-serif text-2xl italic tracking-tight text-stone-900 sm:text-3xl">
            Lénue Paris
          </p>
        </header>
      )}

      <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        {title ? (
          <h1 className="mb-8 font-serif text-3xl italic tracking-tight text-stone-900 sm:text-4xl">
            {canEdit ? (
              <EditableField
                collection="pages"
                id={docId!}
                field="title"
                fieldLabel="Titre"
                currentValue={title}
                locale={locale}
              >
                {title}
              </EditableField>
            ) : (
              title
            )}
          </h1>
        ) : null}

        {canEdit ? (
          <EditableField
            collection="pages"
            id={docId!}
            field="body"
            fieldLabel="Corps du texte"
            currentValue={body}
            locale={locale}
            multiline
          >
            <div className="space-y-6">
              {paragraphs.map((paragraph, i) => {
                const lines = paragraph.split("\n");
                return (
                  <p key={i} className="text-base leading-relaxed text-stone-700 sm:text-lg">
                    {lines.map((line, j) => (
                      <span key={j}>
                        {line}
                        {j < lines.length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                );
              })}
            </div>
          </EditableField>
        ) : (
          <div className="space-y-6">
            {paragraphs.map((paragraph, i) => {
              const lines = paragraph.split("\n");
              return (
                <p key={i} className="text-base leading-relaxed text-stone-700 sm:text-lg">
                  {lines.map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < lines.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              );
            })}
          </div>
        )}
      </article>
    </main>
  );
}
