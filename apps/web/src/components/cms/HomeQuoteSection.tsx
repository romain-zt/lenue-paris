type HomeQuoteSectionProps = {
  quote: string;
};

export function HomeQuoteSection({ quote }: HomeQuoteSectionProps) {
  return (
    <section aria-label="Philosophie" className="bg-section px-4 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-serif text-xl font-light italic leading-relaxed text-muted sm:text-2xl sm:leading-relaxed">
          {quote}
        </p>
        <div className="mx-auto mt-7 h-px w-10 bg-subtle" aria-hidden="true" />
      </div>
    </section>
  );
}
