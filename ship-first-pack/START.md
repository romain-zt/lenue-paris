# Tonight (3 steps)

1. **Download** `ignition-kit.zip` → unzip into your repo root (must already have `.cursor/` + GitHub workflows from this framework).
2. **GitHub** → Settings → Secrets → add `CURSOR_API_KEY`.
3. **Commit + merge to `main`** → validate runs → sync prints `FIREABLE=1` → orchestrator opens `orchestrator/*` PR.

**While it builds:** Zedos **Save PRD** = narrative only (quiet CI). **Add to build queue** = next slice (pre-wire pipeline row + status seed).
