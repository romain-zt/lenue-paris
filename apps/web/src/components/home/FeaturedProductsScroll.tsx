"use client";

import type { ReactNode } from "react";

interface FeaturedProductsScrollProps {
  children: ReactNode;
  ariaLabel: string;
}

export function FeaturedProductsScroll({ children, ariaLabel }: FeaturedProductsScrollProps) {
  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
      <div
        role="list"
        aria-label={ariaLabel}
        className="flex snap-x snap-mandatory gap-10 overflow-x-auto scroll-smooth px-6 pb-2 sm:gap-12 sm:px-10 md:gap-14 lg:gap-16 lg:px-14 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
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
      className="w-[min(72vw,340px)] shrink-0 snap-start sm:w-[min(44vw,320px)] md:w-[min(32vw,340px)] lg:w-[min(24vw,360px)]"
    >
      {children}
    </div>
  );
}
