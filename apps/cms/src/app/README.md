# Payload app routes

Payload 3 serves its admin + API from a Next.js route group `app/(payload)/`.
That route group is **generated boilerplate** — generate it once after cloning:

```bash
# from apps/cms
npx create-payload-app@latest --no-deps   # pick "use current dir", Postgres
# Then run:
pnpm --filter cms generate:types
```

The route group files:
- `app/(payload)/layout.tsx`
- `app/(payload)/admin/[[...segments]]/page.tsx`
- `app/(payload)/admin/[[...segments]]/not-found.tsx`
- `app/(payload)/api/[...slug]/route.ts`

All import config via `@payload-config` alias (set in `tsconfig.json`).

The collections, db, S3, and i18n config in `src/payload.config.ts` are the parts you own.
