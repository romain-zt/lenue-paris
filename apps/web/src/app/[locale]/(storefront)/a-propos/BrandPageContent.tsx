"use client";

import Image from "next/image";
import type { PageCover } from "@/types/page";

export interface BrandPageContentProps {
  title: string;
  body: string;
  cover: PageCover | null;
}

export function BrandPageContent({ title, body, cover }: BrandPageContentProps) {
  const paragraphs = body.split("\n\n").filter(Boolean);

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
        <h1 className="mb-8 font-serif text-3xl italic tracking-tight text-stone-900 sm:text-4xl">
          {title}
        </h1>
        <div className="space-y-6">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed text-stone-700 sm:text-lg">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </main>
  );
}
