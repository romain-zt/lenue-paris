"use client";

import Image from "next/image";
import type { PageCover } from "@/types/page";
import { EditableField } from "@/components/cms/EditableField";

export interface BrandPageContentProps {
  title: string;
  body: string;
  cover: PageCover | null;
  brandName: string;
  /** Payload document ID — enables inline editing in admin edit mode */
  docId?: string;
  /** Locale of the content */
  locale?: string;
}

export function BrandPageContent({ title, body, cover, brandName, docId, locale }: BrandPageContentProps) {
  const paragraphs = body.split("\n\n").filter(Boolean);
  const canEdit = Boolean(docId);

  return (
    <main>
      {cover?.url ? (
        <div className="relative aspect-video w-full overflow-hidden bg-surface sm:aspect-[21/9]">
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
        <header className="border-b border-subtle bg-surface py-12 sm:py-16">
          <p className="text-center font-serif text-2xl italic tracking-tight text-primary sm:text-3xl">
            {brandName}
          </p>
        </header>
      )}

      <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        {title && (
          canEdit ? (
            <EditableField
              collection="pages"
              id={docId!}
              field="title"
              fieldLabel="Titre"
              currentValue={title}
              locale={locale}
            >
              <h1 className="mb-8 font-serif text-3xl italic tracking-tight text-primary sm:text-4xl">
                {title}
              </h1>
            </EditableField>
          ) : (
            <h1 className="mb-8 font-serif text-3xl italic tracking-tight text-primary sm:text-4xl">
              {title}
            </h1>
          )
        )}

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
                  <p key={i} className="text-base leading-relaxed text-secondary sm:text-lg">
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
                <p key={i} className="text-base leading-relaxed text-secondary sm:text-lg">
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
