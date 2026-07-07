import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import type { DesignToken } from "@/payload-types";

type Tokens = Omit<DesignToken, "id" | "updatedAt" | "createdAt">;

const DEFAULTS: Tokens = {
  colorPrimary: "#1c1917",
  colorSecondary: "#44403c",
  colorMuted: "#78716c",
  colorSubtle: "#a8a29e",
  colorPageBg: "#faf7f4",
  colorSurface: "#ffffff",
  colorEditorial: "#f0ebe4",
  colorSection: "#f5f0ea",
  colorSkeleton: "#e8e5e2",
  colorAccent: "#1c1917",
  colorAccentHover: "#44403c",
  colorAccentText: "#ffffff",
  colorBorder: "#e7e5e4",
};

/** Per-request cached token fetch. Falls back to defaults if CMS is unreachable. */
export const getDesignTokens = cache(async (): Promise<Tokens> => {
  try {
    const payload = await getPayload({ config });
    const t = await payload.findGlobal({ slug: "design-tokens" });
    return {
      colorPrimary: t.colorPrimary ?? DEFAULTS.colorPrimary,
      colorSecondary: t.colorSecondary ?? DEFAULTS.colorSecondary,
      colorMuted: t.colorMuted ?? DEFAULTS.colorMuted,
      colorSubtle: t.colorSubtle ?? DEFAULTS.colorSubtle,
      colorPageBg: t.colorPageBg ?? DEFAULTS.colorPageBg,
      colorSurface: t.colorSurface ?? DEFAULTS.colorSurface,
      colorEditorial: t.colorEditorial ?? DEFAULTS.colorEditorial,
      colorSection: t.colorSection ?? DEFAULTS.colorSection,
      colorSkeleton: t.colorSkeleton ?? DEFAULTS.colorSkeleton,
      colorAccent: t.colorAccent ?? DEFAULTS.colorAccent,
      colorAccentHover: t.colorAccentHover ?? DEFAULTS.colorAccentHover,
      colorAccentText: t.colorAccentText ?? DEFAULTS.colorAccentText,
      colorBorder: t.colorBorder ?? DEFAULTS.colorBorder,
    };
  } catch {
    return DEFAULTS;
  }
});

/**
 * Converts tokens to a CSS :root block that overrides the @theme defaults
 * generated at build time by Tailwind. Variables match @theme names exactly.
 */
export function tokensToCSS(tokens: Tokens): string {
  const vars: [string, string | null | undefined][] = [
    ["--color-primary", tokens.colorPrimary],
    ["--color-secondary", tokens.colorSecondary],
    ["--color-muted", tokens.colorMuted],
    ["--color-subtle", tokens.colorSubtle],
    ["--color-page-bg", tokens.colorPageBg],
    ["--color-surface", tokens.colorSurface],
    ["--color-editorial", tokens.colorEditorial],
    ["--color-section", tokens.colorSection],
    ["--color-skeleton", tokens.colorSkeleton],
    ["--color-accent", tokens.colorAccent],
    ["--color-accent-hover", tokens.colorAccentHover],
    ["--color-accent-text", tokens.colorAccentText],
    ["--color-border", tokens.colorBorder],
  ];

  const declarations = vars
    .filter(([, v]) => v)
    .map(([prop, value]) => `  ${prop}: ${value};`)
    .join("\n");

  return `:root {\n${declarations}\n}`;
}
