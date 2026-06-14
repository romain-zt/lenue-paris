/** Attempt client-side WhatsApp handoff after order save — traced to spec AC-2 / AC-3. */
export function openWhatsAppHandoff(url: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(url);
}
