# Scope Slice: Selection UX — Soft Drawer Motion (P0.3)

## Parent Feature Area

[Selection UX](../feature-areas/selection-ux.md)

## Status

`ready-for-user-stories`

---

## User Value

Opening **Ma sélection** feels as calm as the header navigation — backdrop fade and sheet slide, not an abrupt pop-in.

---

## Exact Boundary

### Included

- Replace `SelectionPanel` `if (!open) return null` with animated mount (backdrop ~200ms, sheet `translateY(100%)→0` on mobile)
- Match header nav easing tokens
- `prefers-reduced-motion: instant` fallback

### Excluded

- Selection logic changes (cap, message shape)
- Hero motion slice

---

## Allowlist

- `apps/web/src/components/selection/SelectionPill.tsx` (panel + pill)
- `apps/web/src/app/globals.css` (motion tokens if needed)
- Tests under `apps/web/src/components/selection/**`

---

## Acceptance

- Panel animates open/close on 375px and 1280px
- Reduced motion: no animation, still usable
- No marketplace patterns introduced

---

## Readiness

**Verdict:** READY FOR USER STORIES
