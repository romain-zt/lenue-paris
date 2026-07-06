"use client";

import { buildWhatsAppUrl } from "@/lib/whatsapp/config";

interface ContactPageContentProps {
  title: string;
  body: string;
  brandName: string;
  whatsAppLabel: string;
  whatsAppMessage: string;
  instagramUrl: string;
}

export function ContactPageContent({ title, body, brandName, whatsAppLabel, whatsAppMessage, instagramUrl }: ContactPageContentProps) {
  const paragraphs = body.split("\n\n").filter(Boolean);
  const whatsAppUrl = buildWhatsAppUrl(whatsAppMessage);

  return (
    <main>
      <header className="border-b border-subtle bg-surface py-12 sm:py-16">
        <p className="text-center font-serif text-2xl italic tracking-tight text-primary sm:text-3xl">
          {brandName}
        </p>
      </header>

      <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        {title && (
          <h1 className="mb-8 font-serif text-3xl italic tracking-tight text-primary sm:text-4xl">
            {title}
          </h1>
        )}
        <div className="space-y-6">
          {paragraphs.map((paragraph, i) => {
            const lines = paragraph.split("\n");
            return (
              <p key={i} className="text-base leading-relaxed text-secondary sm:text-lg">
                {lines.map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < lines.length - 1 && <br />}
                  </span>
                ))}
              </p>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center bg-accent px-8 py-3 text-sm font-medium tracking-wide text-accent-text transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {whatsAppLabel}
          </a>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={brandName ? `Instagram ${brandName}` : "Instagram"}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 border border-subtle px-6 py-3 text-sm text-muted transition-colors hover:border-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
            Instagram
          </a>
        </div>
      </article>
    </main>
  );
}
