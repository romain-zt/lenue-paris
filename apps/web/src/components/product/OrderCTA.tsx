"use client";

import type { Product, DressLength, DressSize } from "@/types/product";
import type { CreateOrderRequest } from "@/types/order";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { VariantSelector } from "./VariantSelector";
import { SizePicker } from "./SizePicker";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

interface OrderCTAProps {
  product: Product;
}

const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "79117126262";

export function OrderCTA({ product }: OrderCTAProps) {
  const t = useTranslations("order");
  const tProduct = useTranslations("product");
  const isDress = product.category === "dresses";
  const [length, setLength] = useState<DressLength | null>(null);
  const [size, setSize] = useState<DressSize | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);

  const selectionComplete = !isDress || (length !== null && size !== null);
  const selectionMissing = isDress && !selectionComplete;
  const buyerFieldsFilled = buyerName.trim().length > 0 && buyerContact.trim().length > 0;
  const allRequiredFilled = selectionComplete && buyerFieldsFilled;
  const formDisabled = status === "submitting" || status === "success";

  function buildWhatsAppMessage(name: string, contact: string): string {
    const lines: string[] = [t("whatsappHello", { title: product.title })];
    if (isDress && length) {
      const lengthLabel =
        length === "longer" ? tProduct("lengthLong") : tProduct("lengthShort");
      lines.push(t("whatsappLength", { length: lengthLabel }));
    }
    if (isDress && size) {
      lines.push(t("whatsappSize", { size }));
    }
    lines.push(t("whatsappPrice", { price: product.price }));
    lines.push(t("whatsappName", { name: name.trim() }));
    lines.push(t("whatsappContact", { contact: contact.trim() }));
    return lines.join("\n");
  }

  function buildWhatsAppUrl(name: string, contact: string): string {
    const message = buildWhatsAppMessage(name, contact);
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!allRequiredFilled || status === "submitting") return;

    const trimmedName = buyerName.trim();
    const trimmedContact = buyerContact.trim();
    const url = buildWhatsAppUrl(trimmedName, trimmedContact);
    setWhatsAppUrl(url);

    const body: CreateOrderRequest = {
      productSlug: product.slug,
      buyerName: trimmedName,
      buyerContact: trimmedContact,
    };
    if (isDress && length) body.length = length;
    if (isDress && size) body.size = size;

    setStatus("submitting");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      window.location.href = url;
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isDress && (
          <>
            <VariantSelector selected={length} onChange={setLength} />
            <SizePicker selected={size} onChange={setSize} />
          </>
        )}

        {selectionMissing && (
          <p className="text-xs text-amber-700" role="alert">
            {t("selectionRequired")}
          </p>
        )}

        <div className="space-y-3">
          <input
            type="text"
            name="buyerName"
            placeholder={t("namePlaceholder")}
            required
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            disabled={formDisabled}
            className="min-h-[44px] w-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
          />
          <input
            type="tel"
            name="buyerContact"
            placeholder={t("contactPlaceholder")}
            required
            value={buyerContact}
            onChange={(e) => setBuyerContact(e.target.value)}
            disabled={formDisabled}
            className="min-h-[44px] w-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
          />
        </div>

        {status === "error" && (
          <p className="text-xs text-red-700" role="alert">
            {t("submitError")}
          </p>
        )}

        {status === "success" && (
          <div className="space-y-2 text-sm text-stone-700">
            <p>{t("successMessage")}</p>
            {whatsAppUrl && (
              <p className="text-xs text-stone-500">
                {t("successFallback")}{" "}
                <a href={whatsAppUrl} className="underline hover:text-stone-900">
                  {t("successFallbackLink")}
                </a>
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!allRequiredFilled || status === "submitting"}
          aria-disabled={!allRequiredFilled || status === "submitting"}
          className={`flex min-h-[44px] w-full items-center justify-center px-6 py-3 text-sm font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
            allRequiredFilled && status !== "submitting"
              ? "bg-stone-900 text-white hover:bg-stone-700"
              : "bg-stone-200 text-stone-400"
          }`}
        >
          {status === "submitting" ? t("submitting") : t("submitButton")}
        </button>
      </form>
    </div>
  );
}
