import type { QualityConfig, ScorerResult } from "./types.js";

export function scoreAssetContract(html: string, config: QualityConfig): ScorerResult {
  const rows: ScorerResult["rows"] = [];

  if (config.asset_contract.inline_base64_forbidden) {
    const inline = /src=["']data:image\/[^"']+["']/i.test(html);
    if (inline) {
      rows.push({
        floor_id: "asset_contract",
        observed: "inline base64",
        threshold: "forbidden",
        reference_violated: "S3/MinIO asset paths",
        status: "fail",
      });
    }
  }

  if (rows.length === 0) {
    rows.push({
      floor_id: "asset_contract",
      observed: "no inline base64",
      threshold: "forbidden",
      status: "pass",
    });
  }

  return { rows };
}

export function scoreInfraBlocked(
  floorId: string,
  reason: string,
): ScorerResult {
  return {
    rows: [
      {
        floor_id: floorId,
        observed: reason,
        threshold: "available",
        status: "blocked",
      },
    ],
  };
}
