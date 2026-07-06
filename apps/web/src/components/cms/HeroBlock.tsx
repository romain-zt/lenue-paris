import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { CapsuleBadge } from "@/components/editorial/CapsuleBadge";
import { EditableField } from "@/components/cms/EditableField";
import { useSiteBrand } from "@/lib/site/SiteBrandProvider";
import type { HeroBlockProps } from "@/lib/cms/types";

interface HeroBlockComponentProps extends HeroBlockProps {
  /** Payload blocks array index — used to generate data-payload-path attributes for live preview. */
  blockIndex?: number;
  /** Payload document ID — required for inline editing via EditableField. */
  docId?: string;
  docCollection?: 'pages' | 'products';
  locale?: string;
}

export function HeroBlock({
  season,
  tagline,
  ctaLabel,
  ctaLink,
  heroImageUrl,
  heroImageAlt,
  heroVideoUrl,
  capsuleBadgeLabel,
  blockIndex,
  docId,
  docCollection = 'pages',
  locale,
}: HeroBlockComponentProps) {
  const { wordmarkPrimary, wordmarkSecondary } = useSiteBrand();
  const hasVideo = Boolean(heroVideoUrl);
  const p = blockIndex !== undefined ? `blocks.${blockIndex}` : undefined;
  const canEdit = Boolean(docId && blockIndex !== undefined);

  return (
    <section
      data-maison="hero"
      aria-labelledby="hero-heading"
      className="relative -mt-16 h-[100svh] min-h-[100dvh] overflow-hidden bg-stone-800 md:-mt-[72px]"
    >
      <div
        className="absolute inset-0"
        data-maison="hero-image"
        data-payload-path={p ? `${p}.heroImage` : undefined}
      >
        {hasVideo ? (
          <>
            <video
              src={heroVideoUrl}
              poster={heroImageUrl}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-[50%_40%] motion-reduce:hidden sm:object-[50%_32%] lg:object-[50%_24%]"
            />
            <Image
              src={heroImageUrl}
              alt={heroImageAlt}
              fill
              priority
              sizes="100vw"
              className="hidden object-cover object-[50%_40%] motion-reduce:block sm:object-[50%_32%] lg:object-[50%_24%]"
            />
          </>
        ) : (
          <Image
            src={heroImageUrl}
            alt={heroImageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_40%] sm:object-[50%_32%] lg:object-[50%_24%]"
          />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" aria-hidden="true" />

      <div className="absolute bottom-0 left-0 px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        {capsuleBadgeLabel ? (
          <CapsuleBadge className="mb-3 text-white/55">{capsuleBadgeLabel}</CapsuleBadge>
        ) : null}
        <p
          data-payload-path={p ? `${p}.season` : undefined}
          className="mb-5 text-[10px] font-medium uppercase tracking-[0.35em] text-white/50"
        >
          {canEdit ? (
            <EditableField
              collection={docCollection}
              id={docId!}
              field={`${p}.season`}
              fieldLabel="Saison (héro)"
              currentValue={season}
              locale={locale}
            >
              {season}
            </EditableField>
          ) : season}
        </p>
        <h1
          id="hero-heading"
          className="font-serif text-5xl font-light leading-[0.95] tracking-wide text-white sm:text-6xl lg:text-7xl"
        >
          {wordmarkPrimary}
          {wordmarkSecondary ? (
            <>
              <br />
              <span className="text-3xl tracking-[0.35em] text-white/80 sm:text-4xl lg:text-5xl">
                {wordmarkSecondary}
              </span>
            </>
          ) : null}
        </h1>
        <p
          data-payload-path={p ? `${p}.tagline` : undefined}
          className="mt-5 max-w-xs text-sm font-light leading-relaxed text-white/60 sm:text-[15px]"
        >
          {canEdit ? (
            <EditableField
              collection={docCollection}
              id={docId!}
              field={`${p}.tagline`}
              fieldLabel="Tagline (héro)"
              currentValue={tagline}
              locale={locale}
              multiline
            >
              {tagline}
            </EditableField>
          ) : tagline}
        </p>
        <div
          className="mt-8"
          data-payload-path={p ? `${p}.ctaLabel` : undefined}
        >
          <Link
            href={ctaLink}
            className="group inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-white/80 transition-colors hover:text-white"
          >
            <span className="border-b border-white/40 pb-px transition-colors group-hover:border-white/90">
              {canEdit ? (
                <EditableField
                  collection={docCollection}
                  id={docId!}
                  field={`${p}.ctaLabel`}
                  fieldLabel="Bouton CTA (héro)"
                  currentValue={ctaLabel}
                  locale={locale}
                >
                  {ctaLabel}
                </EditableField>
              ) : ctaLabel}
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
