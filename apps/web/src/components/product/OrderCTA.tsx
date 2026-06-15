"use client";

import type { Product, DressLength, DressSize } from "@/types/product";
import type { CreateOrderRequest } from "@/types/order";
import { useState } from "react";
import { VariantSelector } from "./VariantSelector";
import { SizePicker } from "./SizePicker";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

interface OrderCTAProps {
  product: Product;
}

const WHATSAPP_PHONE =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "79117126262";

export function OrderCTA({ product }: OrderCTAProps) {
  const isDress = product.category === "dresses";
  const [length, setLength] = useState<DressLength | null>(null);
  const [size, setSize] = useState<DressSize | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);

  const selectionComplete = !isDress || (length !== null && size !== null);
  const selectionMissing = isDress && !selectionComplete;
  const buyerFieldsFilled =
    buyerName.trim().length > 0 && buyerContact.trim().length > 0;
  const allRequiredFilled = selectionComplete && buyerFieldsFilled;
  const formDisabled = status === "submitting" || status === "success";

  function buildWhatsAppMessage(name: string, contact: string): string {
    const lines: string[] = [
      `Bonjour, je souhaite commander : ${product.title}`,
    ];
    if (isDress && length) {
      const label = length === "longer" ? "version longue" : "version courte";
      lines.push(`Longueur : ${label}`);
    }
    if (isDress && size) {
      lines.push(`Taille : ${size}`);
    }
    lines.push(`Prix : ${product.price} €`);
    lines.push(`Mon nom : ${name.trim()}`);
    lines.push(`Mon contact : ${contact.trim()}`);
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
            Veuillez choisir une longueur et une taille pour continuer.
          </p>
        )}

        <div className="space-y-3">
          <input
            type="text"
            name="buyerName"
            placeholder="Votre prénom et nom"
            required
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            disabled={formDisabled}
            className="min-h-[44px] w-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
          />
          <input
            type="tel"
            name="buyerContact"
            placeholder="Votre numéro WhatsApp"
            required
            value={buyerContact}
            onChange={(e) => setBuyerContact(e.target.value)}
            disabled={formDisabled}
            className="min-h-[44px] w-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
          />
        </div>

        {status === "error" && (
          <p className="text-xs text-red-700" role="alert">
            Impossible d&apos;enregistrer la commande. Veuillez réessayer.
          </p>
        )}

        {status === "success" && (
          <div className="space-y-2 text-sm text-stone-700">
            <p>
              Votre commande a été enregistrée. WhatsApp va s&apos;ouvrir...
            </p>
            {whatsAppUrl && (
              <p className="text-xs text-stone-500">
                Si WhatsApp ne s&apos;est pas ouvert,{" "}
                <a
                  href={whatsAppUrl}
                  className="underline hover:text-stone-900"
                >
                  cliquez ici pour l&apos;ouvrir manuellement
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
          {status === "submitting"
            ? "Envoi en cours…"
            : "Commander via WhatsApp"}
        </button>
      </form>
    </div>
  );
}
