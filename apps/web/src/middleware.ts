import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/** After a share-link visit, open the storefront AI assistant automatically. */
export const ASSISTANT_OPEN_PARAM = "lp_assistant";
export const ASSISTANT_OPEN_REDIRECT = `/?${ASSISTANT_OPEN_PARAM}=1`;

/**
 * Share links must land on the storefront (PublicAdminFAB exchanges the token).
 * Legacy URLs used /admin?editor_token=… which Payload ignores — redirect them
 * through /api/editor-token so the HttpOnly cookie is set, then send to /.
 */
function redirectAdminEditorToken(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return null;

  const editorToken = searchParams.get("editor_token");
  if (!editorToken) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/api/editor-token";
  url.search = "";
  url.searchParams.set("token", editorToken);
  url.searchParams.set("redirect", ASSISTANT_OPEN_REDIRECT);
  return NextResponse.redirect(url);
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Payload admin — never run next-intl here (it would rewrite /admin → [locale]/[slug] → 404)
  if (pathname.startsWith("/admin")) {
    const adminRedirect = redirectAdminEditorToken(request);
    if (adminRedirect) return adminRedirect;
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    // All pathnames except Payload admin, API routes, Next.js internals,
    // the /next/* utility routes (e.g. /next/preview), and static files.
    "/((?!api|admin|next|_next|_vercel|.*\\..*).*)",
  ],
};
