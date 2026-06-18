import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // All pathnames except Payload admin, API routes, Next.js internals,
    // the /next/* utility routes (e.g. /next/preview), and static files.
    "/((?!api|admin|next|_next|_vercel|.*\\..*).*)",
  ],
};
