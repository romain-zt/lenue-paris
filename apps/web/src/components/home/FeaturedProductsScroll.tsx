"use client";

import type { CSSProperties, ReactNode } from "react";

interface FeaturedProductsScrollProps {
  children: ReactNode;
  ariaLabel: string;
}

export function FeaturedProductsScroll({ children, ariaLabel }: FeaturedProductsScrollProps) {
  return (
    <div className="-mx-4 sm:-mx-6 md:mx-auto md:max-w-screen-xl">
      <div
        role="list"
        aria-label={ariaLabel}
        className={[
          "flex snap-x snap-mandatory gap-8 overflow-x-auto scroll-smooth pb-2",
          "sm:gap-10 md:gap-12 md:snap-proximity lg:gap-14",
          "[--featured-pad:clamp(1.25rem,calc((100vw-min(72vw,340px))/2),3rem)]",
          "md:[--featured-pad:0.75rem] lg:[--featured-pad:1.25rem]",
          "[padding-inline:var(--featured-pad)] [scroll-padding-inline:var(--featured-pad)]",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        ].join(" ")}
        style={{ WebkitOverflowScrolling: "touch" } satisfies CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

export function FeaturedProductItem({ children }: { children: ReactNode }) {
  return (
    <div
      role="listitem"
      className="w-[min(72vw,340px)] shrink-0 snap-center md:w-[min(32vw,320px)] md:snap-start lg:w-[min(26vw,340px)]"
    >
      {children}
    </div>
  );
}
