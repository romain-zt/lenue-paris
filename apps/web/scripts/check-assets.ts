import { PRODUCT_IMAGES } from "../src/lib/productImages";
import { PUBLIC_DRESS_SLUGS } from "../src/lib/catalogue/storefrontCatalogue";

console.log("Checking gallery asset uniqueness for signature dresses…");

const photoUsage = new Map<string, string[]>();

for (const slug of PUBLIC_DRESS_SLUGS) {
  const gallery = PRODUCT_IMAGES[slug]?.gallery ?? [];
  for (const filename of gallery) {
    if (!filename.startsWith("PHOTO-")) continue;
    const dresses = photoUsage.get(filename) ?? [];
    dresses.push(slug);
    photoUsage.set(filename, dresses);
  }
}

const collisions = [...photoUsage.entries()].filter(([, dresses]) => dresses.length > 1);

for (const [filename, dresses] of collisions) {
  console.log(`  COLLISION: ${filename} used by ${dresses.join(", ")}`);
}

console.log(`collisions: ${collisions.length}`);

if (collisions.length > 0) {
  process.exit(1);
}
