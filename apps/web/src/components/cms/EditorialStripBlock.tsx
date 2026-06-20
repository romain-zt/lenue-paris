import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { EditableField } from "@/components/cms/EditableField";
import type { EditorialStripBlockProps } from "@/lib/cms/types";
import type { EditableCollection } from "@/lib/cms/editable";

interface EditorialStripBlockComponentProps extends EditorialStripBlockProps {
  /** Payload blocks array index — used to generate data-payload-path attributes for live preview. */
  blockIndex?: number;
  /** Payload document ID — required for inline editing via EditableField. */
  docId?: string;
  docCollection?: EditableCollection;
  locale?: string;
}

export function EditorialStripBlock({
  label,
  headline,
  subline,
  body,
  ctaLabel,
  ctaLink,
  imageUrl,
  imageAlt,
  blockIndex,
  docId,
  docCollection = 'pages',
  locale,
}: EditorialStripBlockComponentProps) {
  const p = blockIndex !== undefined ? `blocks.${blockIndex}` : undefined;
  const canEdit = Boolean(docId && blockIndex !== undefined);

  return (
    <section aria-label={label} className="overflow-hidden bg-[#f0ebe4] lg:flex">
      <div className="flex flex-col justify-center px-8 py-16 sm:px-12 sm:py-20 lg:w-[42%] lg:px-14 lg:py-24">
        <p
          data-payload-path={p ? `${p}.label` : undefined}
          className="mb-6 text-[9px] font-medium uppercase tracking-[0.38em] text-stone-400"
        >
          {canEdit ? (
            <EditableField
              collection={docCollection}
              id={docId!}
              field={`${p}.label`}
              fieldLabel="Label (bande éditoriale)"
              currentValue={label}
              locale={locale}
            >
              {label}
            </EditableField>
          ) : label}
        </p>
        <h2 className="font-serif text-3xl font-light leading-snug text-stone-800 sm:text-4xl lg:text-[2.6rem] lg:leading-snug">
          <span data-payload-path={p ? `${p}.headline` : undefined}>
            {canEdit ? (
              <EditableField
                collection={docCollection}
                id={docId!}
                field={`${p}.headline`}
                fieldLabel="Titre principal (bande éditoriale)"
                currentValue={headline}
                locale={locale}
              >
                {headline}
              </EditableField>
            ) : headline}
          </span>
          <br />
          <em
            data-payload-path={p ? `${p}.subline` : undefined}
            className="font-light not-italic text-stone-600"
          >
            {canEdit ? (
              <EditableField
                collection={docCollection}
                id={docId!}
                field={`${p}.subline`}
                fieldLabel="Sous-titre (bande éditoriale)"
                currentValue={subline}
                locale={locale}
              >
                {subline}
              </EditableField>
            ) : subline}
          </em>
        </h2>
        <div className="my-8 h-px w-12 bg-stone-300" aria-hidden="true" />
        <div
          data-payload-path={p ? `${p}.body` : undefined}
          className="max-w-xs text-sm leading-relaxed text-stone-500"
        >
          {canEdit ? (
            <EditableField
              collection={docCollection}
              id={docId!}
              field={`${p}.body`}
              fieldLabel="Corps du texte (bande éditoriale)"
              currentValue={body}
              locale={locale}
              multiline
            >
              {body}
            </EditableField>
          ) : (
            body
          )}
        </div>
        <div className="mt-10" data-payload-path={p ? `${p}.ctaLabel` : undefined}>
          <Link
            href={ctaLink}
            className="group inline-flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.25em] text-stone-600 transition-colors hover:text-stone-900"
          >
            <span className="border-b border-stone-400 pb-px transition-colors group-hover:border-stone-900">
              {canEdit ? (
                <EditableField
                  collection={docCollection}
                  id={docId!}
                  field={`${p}.ctaLabel`}
                  fieldLabel="Bouton CTA (bande éditoriale)"
                  currentValue={ctaLabel}
                  locale={locale}
                >
                  {ctaLabel}
                </EditableField>
              ) : ctaLabel}
            </span>
            <span aria-hidden="true">→</span>
          </Link>
          {canEdit ? (
            <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-stone-400">
              <span>Lien : </span>
              <EditableField
                collection={docCollection}
                id={docId!}
                field={`${p}.ctaLink`}
                fieldLabel="URL du bouton (bande éditoriale)"
                currentValue={ctaLink}
                locale={locale}
              >
                {ctaLink}
              </EditableField>
            </p>
          ) : null}
        </div>
      </div>
      <div
        className="relative aspect-[4/3] lg:aspect-auto lg:flex-1"
        data-payload-path={p ? `${p}.image` : undefined}
      >
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
