"use client";

import { createContext, useContext, type ReactNode } from "react";

export type SiteBrand = {
  brandName: string;
  wordmarkPrimary: string;
  wordmarkSecondary: string;
};

const SiteBrandContext = createContext<SiteBrand>({
  brandName: "",
  wordmarkPrimary: "",
  wordmarkSecondary: "",
});

export function SiteBrandProvider({ value, children }: { value: SiteBrand; children: ReactNode }) {
  return <SiteBrandContext.Provider value={value}>{children}</SiteBrandContext.Provider>;
}

export function useSiteBrand(): SiteBrand {
  return useContext(SiteBrandContext);
}
