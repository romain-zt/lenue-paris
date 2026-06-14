"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { SupportedLocale } from "@repo/catalog";
import {
  DEFAULT_WHATSAPP_ORDER_NUMBER,
  getLengthLabel,
  validateOrderInput,
  type CreateOrderInput,
  type OrderValidationError,
} from "@repo/checkout";
import {
  isVariantSelectionComplete,
  type ProductDetail,
  type ProductVariantSelection,
} from "@repo/product-detail";
import type { CheckoutCopy } from "@/lib/checkout-copy";
import { formatProductPrice } from "@/lib/pdp-copy";
import { openWhatsAppHandoff } from "@/lib/open-whatsapp-handoff";
import styles from "./checkout.module.css";

type CheckoutPhase = "form" | "submitting" | "success" | "save_failed";

interface CheckoutFormProps {
  product: ProductDetail;
  locale: SupportedLocale;
  variantSelection: ProductVariantSelection;
  copy: CheckoutCopy;
}

function errorsByField(errors: OrderValidationError[]): Map<string, string> {
  return new Map(errors.map((error) => [error.field, error.message]));
}

export function CheckoutForm({
  product,
  locale,
  variantSelection,
  copy,
}: CheckoutFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phase, setPhase] = useState<CheckoutPhase>("form");
  const [fieldErrors, setFieldErrors] = useState<Map<string, string>>(new Map());
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const variantsComplete = isVariantSelectionComplete(
    product.variantPickers,
    variantSelection,
  );

  const summaryVariants = useMemo(() => {
    if (!product.variantPickers) {
      return null;
    }

    const lines: string[] = [];

    if (variantSelection.length) {
      lines.push(
        `${copy.lengthLabel}: ${getLengthLabel(locale, variantSelection.length)}`,
      );
    }

    if (variantSelection.size) {
      lines.push(`${copy.sizeLabel}: ${variantSelection.size}`);
    }

    return lines;
  }, [copy.lengthLabel, copy.sizeLabel, locale, product.variantPickers, variantSelection]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!variantsComplete || phase === "submitting") {
      return;
    }

    const input: CreateOrderInput = {
      customerName,
      customerPhone,
      productSlug: product.slug,
      locale,
      length: variantSelection.length,
      size: variantSelection.size,
    };

    const email = customerEmail.trim();
    if (email) {
      input.customerEmail = email;
    }

    const validationErrors = validateOrderInput(input, {
      variantPickers: product.variantPickers,
    });

    if (validationErrors.length > 0) {
      setFieldErrors(errorsByField(validationErrors));
      return;
    }

    setFieldErrors(new Map());
    setPhase("submitting");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (response.status === 400) {
        const body = (await response.json()) as { errors?: OrderValidationError[] };
        setFieldErrors(errorsByField(body.errors ?? []));
        setPhase("form");
        return;
      }

      if (!response.ok) {
        setPhase("save_failed");
        return;
      }

      const body = (await response.json()) as { whatsappUrl: string };
      setWhatsappUrl(body.whatsappUrl);
      setPhase("success");
      openWhatsAppHandoff(body.whatsappUrl);
    } catch {
      setPhase("save_failed");
    }
  }

  const heroImage = product.gallery[0];

  if (phase === "success" && whatsappUrl) {
    return (
      <section className={styles.statusPanel} aria-live="polite">
        <h2 className={styles.statusTitle}>{copy.successTitle}</h2>
        <p className={styles.statusBody}>{copy.successBody}</p>
        <div className={styles.statusPanel}>
          <h3 className={styles.statusTitle}>{copy.whatsappFallbackTitle}</h3>
          <p className={styles.statusBody}>
            {copy.whatsappFallbackBody}{" "}
            <span className={styles.phoneNumber}>+{DEFAULT_WHATSAPP_ORDER_NUMBER}</span>
          </p>
          <a
            href={whatsappUrl}
            className={styles.whatsappLink}
            rel="noopener noreferrer"
          >
            {copy.whatsappLinkLabel}
          </a>
        </div>
      </section>
    );
  }

  if (phase === "save_failed") {
    return (
      <section className={styles.statusPanel} aria-live="polite">
        <h2 className={styles.statusTitle}>{copy.saveFailedTitle}</h2>
        <p className={styles.statusBody}>{copy.saveFailedBody}</p>
        <button
          type="button"
          className={styles.submitButton}
          onClick={() => setPhase("form")}
        >
          {copy.retryCta}
        </button>
      </section>
    );
  }

  return (
    <div className={styles.layout}>
      <section className={styles.summary} aria-label={copy.productSummaryLabel}>
        {heroImage ? (
          <div className={styles.summaryImageWrap}>
            <Image
              src={heroImage.url}
              alt={heroImage.alt}
              fill
              sizes="88px"
              className={styles.summaryImage}
            />
          </div>
        ) : null}
        <div className={styles.summaryDetails}>
          <p className={styles.summaryLabel}>{copy.productSummaryLabel}</p>
          <h2 className={styles.productName}>{product.name}</h2>
          <p className={styles.price}>
            {formatProductPrice(product.price, locale)}
          </p>
          {summaryVariants?.map((line) => (
            <p key={line} className={styles.variantLine}>
              {line}
            </p>
          ))}
        </div>
      </section>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="customerName">
            {copy.nameLabel}
          </label>
          <input
            id="customerName"
            name="customerName"
            type="text"
            autoComplete="name"
            className={`${styles.input} ${
              fieldErrors.has("customerName") ? styles.inputError : ""
            }`}
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            disabled={phase === "submitting"}
            aria-invalid={fieldErrors.has("customerName")}
            aria-describedby={
              fieldErrors.has("customerName") ? "customerName-error" : undefined
            }
          />
          {fieldErrors.has("customerName") ? (
            <p id="customerName-error" className={styles.fieldError} role="alert">
              {fieldErrors.get("customerName")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="customerPhone">
            {copy.phoneLabel}
          </label>
          <input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            autoComplete="tel"
            className={`${styles.input} ${
              fieldErrors.has("customerPhone") ? styles.inputError : ""
            }`}
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            disabled={phase === "submitting"}
            aria-invalid={fieldErrors.has("customerPhone")}
            aria-describedby={
              fieldErrors.has("customerPhone") ? "customerPhone-error" : undefined
            }
          />
          {fieldErrors.has("customerPhone") ? (
            <p id="customerPhone-error" className={styles.fieldError} role="alert">
              {fieldErrors.get("customerPhone")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label} htmlFor="customerEmail">
              {copy.emailLabel}
            </label>
            <span className={styles.optionalHint}>{copy.emailOptionalHint}</span>
          </div>
          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            autoComplete="email"
            className={`${styles.input} ${
              fieldErrors.has("customerEmail") ? styles.inputError : ""
            }`}
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            disabled={phase === "submitting"}
            aria-invalid={fieldErrors.has("customerEmail")}
            aria-describedby={
              fieldErrors.has("customerEmail") ? "customerEmail-error" : undefined
            }
          />
          {fieldErrors.has("customerEmail") ? (
            <p id="customerEmail-error" className={styles.fieldError} role="alert">
              {fieldErrors.get("customerEmail")}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={!variantsComplete || phase === "submitting"}
        >
          {phase === "submitting" ? copy.submittingLabel : copy.submitCta}
        </button>
      </form>
    </div>
  );
}

interface CheckoutVariantsMissingProps {
  productHref: string;
  copy: CheckoutCopy;
}

export function CheckoutVariantsMissing({
  productHref,
  copy,
}: CheckoutVariantsMissingProps) {
  return (
    <section className={styles.warningPanel}>
      <h2 className={styles.warningTitle}>{copy.variantsMissingTitle}</h2>
      <p className={styles.warningBody}>{copy.variantsMissingBody}</p>
      <Link href={productHref} className={styles.backLink}>
        {copy.backToProduct}
      </Link>
    </section>
  );
}
