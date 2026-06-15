import type { FloorRow, ScorerResult } from "./types.js";
import { computeDhash8x8, hammingDistance } from "./dhash.js";
import { resolvePublicImageSrc } from "./referenced-assets.js";

export interface FrameSurface {
  id: string;
  maisonAttr: string;
}

function extractSurfaceHtml(html: string, maisonAttr: string): string {
  const re = new RegExp(
    `<[^>]*data-maison=["']${maisonAttr}["'][^>]*>([\\s\\S]*?)(?=<(?:footer|main\\b)|$)`,
    "i",
  );
  const match = html.match(re);
  return match?.[0] ?? html;
}

export function extractImgSrcs(html: string, maisonAttr: string): string[] {
  const chunk = extractSurfaceHtml(html, maisonAttr);
  const srcs: string[] = [];
  for (const m of chunk.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    srcs.push(m[1]);
  }
  return srcs;
}

export async function scoreCatalogueFrameUniquenessFromSrcs(
  surfaceId: string,
  srcs: string[],
): Promise<FloorRow[]> {
  const resolved = srcs
    .map((src) => ({ src, path: resolvePublicImageSrc(src) }))
    .filter((r): r is { src: string; path: string } => Boolean(r.path));

  if (resolved.length < 2) {
    return [
      {
        floor_id: "catalogue_frame_uniqueness",
        observed: `${surfaceId}:frames=${resolved.length}`,
        threshold: "dhash_zero_pairs:0",
        status: "pass",
      },
    ];
  }

  const hashes: { src: string; dhash: string }[] = [];
  for (const item of resolved) {
    hashes.push({ src: item.src, dhash: await computeDhash8x8(item.path) });
  }

  const rows: FloorRow[] = [];
  for (let i = 0; i < hashes.length; i++) {
    for (let j = i + 1; j < hashes.length; j++) {
      const dist = hammingDistance(hashes[i].dhash, hashes[j].dhash);
      if (dist === 0) {
        rows.push({
          floor_id: "catalogue_frame_uniqueness",
          observed: `${hashes[i].src} ↔ ${hashes[j].src} (dhash:0)`,
          threshold: "dhash_zero_pairs:0",
          reference_violated: surfaceId,
          status: "fail",
        });
      }
    }
  }

  if (rows.length === 0) {
    rows.push({
      floor_id: "catalogue_frame_uniqueness",
      observed: 0,
      threshold: 0,
      reference_violated: surfaceId,
      status: "pass",
    });
  }

  return rows;
}

export async function scoreCatalogueFrameUniquenessFromHtml(
  html: string,
  surfaces: FrameSurface[],
): Promise<ScorerResult> {
  const rows: FloorRow[] = [];
  for (const surface of surfaces) {
    const srcs = extractImgSrcs(html, surface.maisonAttr);
    rows.push(...(await scoreCatalogueFrameUniquenessFromSrcs(surface.id, srcs)));
  }
  return { rows };
}

export async function scoreCatalogueFrameUniquenessLive(
  previewBase: string,
  surfaces: { id: string; path: string; maisonAttr: string }[],
): Promise<ScorerResult> {
  const rows: FloorRow[] = [];

  for (const surface of surfaces) {
    const url = `${previewBase.replace(/\/$/, "")}${surface.path}`;
    const res = await fetch(url);
    if (!res.ok) {
      rows.push({
        floor_id: "catalogue_frame_uniqueness",
        observed: `http_${res.status}`,
        threshold: "page_reachable",
        reference_violated: surface.id,
        status: "fail",
      });
      continue;
    }

    const html = await res.text();
    const srcs = extractImgSrcs(html, surface.maisonAttr);
    rows.push(...(await scoreCatalogueFrameUniquenessFromSrcs(surface.id, srcs)));
  }

  return { rows };
}
