import type { FloorRow, ScorerResult } from "./types.js";
import { collectReferencedAssets } from "./referenced-assets.js";

export function scoreAssetDuplicateHash(): ScorerResult {
  const assets = collectReferencedAssets();
  const missing = assets.filter((a) => !a.resolvedPath || !a.md5);
  const byMd5 = new Map<string, typeof assets>();

  for (const asset of assets) {
    if (!asset.md5) continue;
    const group = byMd5.get(asset.md5) ?? [];
    group.push(asset);
    byMd5.set(asset.md5, group);
  }

  const collisions = [...byMd5.entries()].filter(([, group]) => {
    const uniqueFilenames = new Set(group.map((a) => a.filename));
    return uniqueFilenames.size > 1;
  });

  const rows: FloorRow[] = [];

  for (const asset of missing) {
    rows.push({
      floor_id: "asset_duplicate_hash",
      observed: `missing:${asset.filename}`,
      threshold: "file_resolves",
      reference_violated: asset.source,
      status: "fail",
    });
  }

  for (const [md5, group] of collisions) {
    const filenames = [...new Set(group.map((a) => a.filename))];
    rows.push({
      floor_id: "asset_duplicate_hash",
      observed: `${filenames.join(" ↔ ")} (md5:${md5.slice(0, 8)})`,
      threshold: "collisions:0",
      reference_violated: group.map((a) => a.source).join("; "),
      status: "fail",
    });
  }

  if (rows.length === 0) {
    rows.push({
      floor_id: "asset_duplicate_hash",
      observed: 0,
      threshold: 0,
      status: "pass",
    });
  }

  return { rows };
}
