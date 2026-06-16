export const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "79117126262";

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
