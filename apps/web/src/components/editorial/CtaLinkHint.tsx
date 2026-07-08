import { EditableField } from "@/components/cms/EditableField";

interface CtaLinkHintProps {
  ctaLink: string;
  className?: string;
  payloadPath?: string;
  canEdit?: boolean;
  docId?: string;
  docCollection?: "pages" | "products";
  locale?: string;
}

export function CtaLinkHint({
  ctaLink,
  className = "mt-3 text-[9px] font-medium uppercase tracking-[0.28em] text-subtle/80",
  payloadPath,
  canEdit = false,
  docId,
  docCollection = "pages",
  locale,
}: CtaLinkHintProps) {
  const label = `LIEN : ${ctaLink.toUpperCase()}`;

  return (
    <p className={className} data-payload-path={payloadPath}>
      {canEdit && docId && payloadPath ? (
        <EditableField
          collection={docCollection}
          id={docId}
          field={payloadPath}
          fieldLabel="Lien du bouton"
          currentValue={ctaLink}
          locale={locale}
        >
          {label}
        </EditableField>
      ) : (
        label
      )}
    </p>
  );
}
