import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { EditorialStripBlockProps } from "@/lib/cms/types";

export function EditorialStripBlock({
  label,
  headline,
  subline,
  body,
  ctaLabel,
  ctaLink,
  imageUrl,
  imageAlt,
}: EditorialStripBlockProps) {
  return (
    <section aria-label={label} className="overflow-hidden bg-[#f0ebe4] lg:flex">
      <div className="flex flex-col justify-center px-8 py-16 sm:px-12 sm:py-20 lg:w-[42%] lg:px-14 lg:py-24">
        <p className="mb-6 text-[9px] font-medium uppercase tracking-[0.38em] text-stone-400">{label}</p>
        <h2 className="font-serif text-3xl font-light leading-snug text-stone-800 sm:text-4xl lg:text-[2.6rem] lg:leading-snug">
          {headline}
          <br />
          <em className="font-light not-italic text-stone-600">{subline}</em>
        </h2>
        <div className="my-8 h-px w-12 bg-stone-300" aria-hidden="true" />
        <p className="max-w-xs text-sm leading-relaxed text-stone-500">{body}</p>
        <div className="mt-10">
          <Link
            href={ctaLink}
            className="group inline-flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.25em] text-stone-600 transition-colors hover:text-stone-900"
          >
            <span className="border-b border-stone-400 pb-px transition-colors group-hover:border-stone-900">
              {ctaLabel}
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <div className="relative aspect-[4/3] lg:aspect-auto lg:flex-1">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="object-cover object-top"
        />
        <div
          className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#f0ebe4] to-transparent lg:block"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
