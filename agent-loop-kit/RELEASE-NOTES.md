# agent-loop-kit v0.1 — Release Notes

## What this is

Session-one autonomous bootstrap: draft idea in, structured artifacts out, one merged slice, overlay learning, core untouched.

## Requirements

- Node 20 LTS
- OPENAI_API_KEY (live loop; offline demo works without)

## Included (v0.1)

- Copy readability, design tokens, SEO meta, alt-text scorers (deterministic)
- LLM reviewers via openai/gpt-4.1-mini (live mode)
- Convergence Packet + human veto checkpoint
- Slice Contract freeze + adversarial freeze-bypass tests
- Three starter overlay packs: saas-landing, internal-tool, marketplace
- `./verify.sh --offline` and `--live`
- Export / promote scripts (overlay only)

## Excluded (deferred to v0.2)

- Image generation agent
- Pinned static analysis (eslint/ruff) for code
- Multi-slice autonomy (live Run D)
- Self-improvement without human promotion
- Richer mid-slice PRD influence beyond queue-and-wait

## Ceilings (live mode)

- 12 agent calls / 8 minutes / $0.80 estimated
- Exceed → `project/resume-at-veto.json` (checkpoint, not broken state)

## Ollama

Dev-only. No parity claim with OpenAI.
