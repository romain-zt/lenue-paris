# Pipeline anchor

This file is the target of the permanent `bootstrap` step in
`docs/state/orchestration.pipeline.json`. That step is always `complete`, so this
file is never read by a cloud agent — it only needs to exist so the anchor step
references a real path.

New work attaches *after* `bootstrap` (see `orchestration.prd-flow-map.json` →
`attachAfterStepId`). Do not delete this file or the `bootstrap` step.
