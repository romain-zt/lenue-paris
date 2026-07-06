import { getDesignTokens, tokensToCSS } from "@/lib/cms/designTokens";

/**
 * Server component — fetches design tokens from the CMS global and injects
 * them as CSS custom properties into <head> at request time.
 *
 * Because this is a React Server Component, the injected values are fresh on
 * every request (subject to Next.js route caching). No JavaScript runs on the
 * client for this component; the <style> tag lands in the initial HTML.
 *
 * Usage: render once inside the root layout, before </head> or at the top of
 * <body>, alongside the existing globals.css import.
 */
export async function TokenInjector() {
  const tokens = await getDesignTokens();
  const css = tokensToCSS(tokens);

  return (
    <style
      data-token-injector
      // dangerouslySetInnerHTML is safe here: values come from the admin database,
      // are controlled by authenticated users only, and contain CSS property values
      // which are sanitised by the browser's CSS parser.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
