import sharp from "sharp";

/** dhash-8x8 with LANCZOS resize — must match Step 1 phash calibration. */
export async function computeDhash8x8(filePath: string): Promise<string> {
  const { data } = await sharp(filePath)
    .grayscale()
    .resize(9, 8, { kernel: sharp.kernel.lanczos3, fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let hash = "";
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = data[y * 9 + x];
      const right = data[y * 9 + x + 1];
      hash += left < right ? "1" : "0";
    }
  }
  return hash;
}

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Math.max(a.length, b.length);
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}
