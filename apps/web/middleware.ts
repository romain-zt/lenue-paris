import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

function detectLocale(request: NextRequest): string {
  // Prefer the persisted locale cookie
  const cookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && (routing.locales as readonly string[]).includes(cookie)) {
    return cookie;
  }
  // Fall back to Accept-Language header
  const acceptLang = request.headers.get("accept-language") ?? "";
  for (const part of acceptLang.split(",")) {
    const lang = (part.split(";")[0] ?? "").trim().split("-")[0]?.toLowerCase() ?? "";
    if (lang && (routing.locales as readonly string[]).includes(lang)) return lang;
  }
  return routing.defaultLocale;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Safety net for the root path: next-intl should rewrite "/" → "/fr" internally,
  // but on some Vercel edge deployments it passes through, leaving no matching page.
  // We explicitly handle locale detection + rewrite/redirect here.
  if (pathname === "/") {
    const locale = detectLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    if (locale === routing.defaultLocale) {
      // Rewrite keeps the URL as "/" in the browser while serving [locale]/page.tsx
      return NextResponse.rewrite(url);
    }
    // Non-default locales get a proper redirect to their prefixed URL
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except Payload admin, API routes, and static files
  matcher: ["/((?!admin|api|_next|_vercel|.*\\..*).*)"],
};
