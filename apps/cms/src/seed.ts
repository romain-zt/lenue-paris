/**
 * Lénue Paris — CMS seed script
 *
 * Populates the database with a curated catalogue of dresses, bags and scarves
 * using the real product photos from lenue-assets-bootstrap/pics/.
 *
 * Run:  pnpm --filter cms seed
 */

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import fs from "fs";
import { getPayload } from "payload";
import config from "./payload.config.js";

const PICS_DIR = path.resolve(__dirname, "../../../lenue-assets-bootstrap/pics");

// ---------- Image helpers ----------

function readImage(filename: string) {
  const filepath = path.join(PICS_DIR, filename);
  const data = fs.readFileSync(filepath);
  const stats = fs.statSync(filepath);
  return {
    data,
    mimetype: "image/jpeg" as const,
    name: filename,
    size: stats.size,
  };
}

// Map photo filenames to short aliases for readability
const PHOTOS = {
  p01: "PHOTO-2026-06-12-17-30-32.jpg",
  p02: "PHOTO-2026-06-12-17-30-46.jpg",
  p03: "PHOTO-2026-06-12-17-30-46 2.jpg",
  p04: "PHOTO-2026-06-12-17-30-55.jpg",
  p05: "PHOTO-2026-06-12-17-32-33.jpg",
  p06: "PHOTO-2026-06-12-17-34-10.jpg",
  p07: "PHOTO-2026-06-12-18-02-44.jpg",
  p08: "PHOTO-2026-06-12-18-02-56.jpg",
  p09: "PHOTO-2026-06-12-18-07-46.jpg",
  p10: "PHOTO-2026-06-12-22-37-23.jpg",
  p11: "PHOTO-2026-06-12-23-17-32.jpg",
  p12: "PHOTO-2026-06-12-23-17-32 2.jpg",
  p13: "PHOTO-2026-06-12-23-29-01.jpg",
  p14: "PHOTO-2026-06-13-08-45-40.jpg",
} as const;

// ---------- Product catalogue ----------

const PRODUCTS = [
  // ────── Robes ──────
  {
    title: { en: "Camille Dress", fr: "Robe Camille" },
    slug: "robe-camille",
    category: "dresses" as const,
    price: 290,
    description: {
      en: "A fluid midi silhouette cut from lightweight ivory cotton. Adjustable tie waist, hidden side pockets. Worn mid-calf or belted at the knee.",
      fr: "Silhouette midi fluide taillée dans un coton ivoire léger. Taille ajustable par lacet, poches latérales cachées. Portée mi-mollet ou ceinturée au genou.",
    },
    availableLengths: ["longer", "shorter"] as const,
    availableSizes: ["XS", "S", "M", "L"] as const,
    mainImage: PHOTOS.p02,
    gallery: [PHOTOS.p03, PHOTOS.p01],
  },
  {
    title: { en: "Louise Dress", fr: "Robe Louise" },
    slug: "robe-louise",
    category: "dresses" as const,
    price: 320,
    description: {
      en: "Draped wrap silhouette in stone linen. A single button at the collar, deep V-neckline. Relaxed fit that moves with the body.",
      fr: "Silhouette portefeuille drapée en lin stone. Un bouton au col, décolleté V profond. Coupe décontractée qui épouse les mouvements.",
    },
    availableLengths: ["longer", "shorter"] as const,
    availableSizes: ["XS", "S", "M", "L", "XL"] as const,
    mainImage: PHOTOS.p04,
    gallery: [PHOTOS.p05],
  },
  {
    title: { en: "Margot Dress", fr: "Robe Margot" },
    slug: "robe-margot",
    category: "dresses" as const,
    price: 275,
    description: {
      en: "Gathered maxi in écru cotton poplin. Smocked bodice, slightly puffed sleeves, full skirt. Effortless from morning to evening.",
      fr: "Maxi froncée en popeline de coton écru. Corsage smocké, manches légèrement bouffantes, jupe ample. Portée du matin au soir.",
    },
    availableLengths: ["longer"] as const,
    availableSizes: ["XS", "S", "M", "L"] as const,
    mainImage: PHOTOS.p06,
    gallery: [PHOTOS.p01],
  },
  {
    title: { en: "Héloïse Dress", fr: "Robe Héloïse" },
    slug: "robe-heloise",
    category: "dresses" as const,
    price: 345,
    description: {
      en: "Column silhouette in sage silk-cotton. Minimal seaming, invisible back zip. The kind of dress you keep for twenty years.",
      fr: "Silhouette colonne en soie-coton sauge. Coutures épurées, fermeture invisible dans le dos. La robe que l'on garde vingt ans.",
    },
    availableLengths: ["longer", "shorter"] as const,
    availableSizes: ["XS", "S", "M", "L"] as const,
    mainImage: PHOTOS.p07,
    gallery: [PHOTOS.p08],
  },

  // ────── Sacs ──────
  {
    title: { en: "Juliette Bag", fr: "Sac Juliette" },
    slug: "sac-juliette",
    category: "bags" as const,
    price: 420,
    description: {
      en: "Structured tote in full-grain natural leather. Open top, single interior slip pocket. Fits an A4 notebook with room to spare.",
      fr: "Tote structuré en cuir pleine fleur naturel. Ouverture large, une poche intérieure. Format A4 et plus.",
    },
    mainImage: PHOTOS.p09,
    gallery: [PHOTOS.p10],
  },
  {
    title: { en: "Amélie Bag", fr: "Sac Amélie" },
    slug: "sac-amelie",
    category: "bags" as const,
    price: 385,
    description: {
      en: "Soft bucket silhouette in pebbled tan leather. Drawstring closure, detachable leather strap. One interior zip pocket.",
      fr: "Seau souple en cuir grainé camel. Fermeture cordon, bandoulière amovible. Une poche zippée à l'intérieur.",
    },
    mainImage: PHOTOS.p11,
    gallery: [PHOTOS.p12],
  },
  {
    title: { en: "Céleste Bag", fr: "Sac Céleste" },
    slug: "sac-celeste",
    category: "bags" as const,
    price: 310,
    description: {
      en: "Slim crossbody in chalk vegetable-tanned leather. Adjustable strap, magnetic snap closure. Holds a phone, cards and keys.",
      fr: "Bandoulière fine en cuir tanné végétal craie. Sangle réglable, fermoir magnétique. Téléphone, cartes et clés.",
    },
    mainImage: PHOTOS.p13,
    gallery: [],
  },
  {
    title: { en: "Victoire Bag", fr: "Sac Victoire" },
    slug: "sac-victoire",
    category: "bags" as const,
    price: 265,
    description: {
      en: "Compact half-moon clutch in cognac leather. Zip-top, wrist loop. Goes from office to dinner without changing bags.",
      fr: "Pochette demi-lune compacte en cuir cognac. Zip supérieur, anneau de poignet. Du bureau au dîner sans changer de sac.",
    },
    mainImage: PHOTOS.p14,
    gallery: [],
  },

  // ────── Foulards ──────
  {
    title: { en: "Diane Scarf", fr: "Foulard Diane" },
    slug: "foulard-diane",
    category: "scarfs" as const,
    price: 130,
    description: {
      en: "90×90 cm twill silk. Hand-rolled hem. Printed with a subtle floral motif in dusty rose and terracotta.",
      fr: "Carré en twill de soie 90×90 cm. Ourlet roulotté à la main. Motif floral discret en rose poudré et terracotta.",
    },
    mainImage: PHOTOS.p03,
    gallery: [],
  },
  {
    title: { en: "Aurore Scarf", fr: "Foulard Aurore" },
    slug: "foulard-aurore",
    category: "scarfs" as const,
    price: 115,
    description: {
      en: "70×70 cm silk crêpe de chine. Hand-rolled hem. Dip-dyed gradient from ivory to warm sand.",
      fr: "Carré en crêpe de chine 70×70 cm. Ourlet roulotté main. Dégradé tie-dye ivoire à sable chaud.",
    },
    mainImage: PHOTOS.p05,
    gallery: [],
  },
  {
    title: { en: "Claire Scarf", fr: "Foulard Claire" },
    slug: "foulard-claire",
    category: "scarfs" as const,
    price: 98,
    description: {
      en: "Long 200×70 cm in lightweight wool-silk blend. Fringed ends. Wear as a scarf, wrap or shawl.",
      fr: "Écharpe longue 200×70 cm en laine-soie légère. Extrémités effilochées. Portée en écharpe, châle ou wrap.",
    },
    mainImage: PHOTOS.p08,
    gallery: [],
  },
  {
    title: { en: "Iris Scarf", fr: "Foulard Iris" },
    slug: "foulard-iris",
    category: "scarfs" as const,
    price: 85,
    description: {
      en: "90×90 cm cotton muslin. Geometric print in black and écru. Light enough to wear knotted in the hair.",
      fr: "Carré en mousseline de coton 90×90 cm. Impression géométrique noir et écru. Assez léger pour un nœud dans les cheveux.",
    },
    mainImage: PHOTOS.p10,
    gallery: [],
  },
];

// ---------- Seed runner ----------

async function seed() {
  const payload = await getPayload({ config });

  console.log("⚙  Payload initialized");

  // 1. Create admin user if none exists
  const existingUsers = await payload.find({ collection: "users", limit: 1 });
  if (existingUsers.totalDocs === 0) {
    await payload.create({
      collection: "users",
      data: {
        email: "admin@lenue.paris",
        password: "lenue2026",
        name: "Lénue Admin",
      },
    });
    console.log("👤 Admin user created — admin@lenue.paris / lenue2026");
  } else {
    console.log("👤 Admin user already exists — skipping");
  }

  // 2. Wipe existing products (re-runnable)
  const existing = await payload.find({ collection: "products", limit: 100 });
  for (const product of existing.docs) {
    await payload.delete({ collection: "products", id: product.id });
  }
  console.log(`🗑  Cleared ${existing.totalDocs} existing products`);

  // 3. Upload images and cache Media IDs
  const mediaCache: Record<string, number | string> = {};

  const uploadImage = async (filename: string): Promise<number | string> => {
    if (mediaCache[filename]) return mediaCache[filename];

    const file = readImage(filename);
    const media = await payload.create({
      collection: "media",
      data: { alt: filename.replace(".jpg", "").replace(/[_-]/g, " ") },
      file,
      locale: "en",
    });
    mediaCache[filename] = media.id;
    console.log(`  📷 Uploaded ${filename} → id ${media.id}`);
    return media.id;
  };

  // 4. Create products
  for (const product of PRODUCTS) {
    console.log(`\n📦 Creating: ${product.title.fr}`);

    const mainImageId = await uploadImage(product.mainImage);

    const galleryItems: { image: number | string }[] = [];
    for (const imgFile of product.gallery) {
      const id = await uploadImage(imgFile);
      galleryItems.push({ image: id });
    }

    const data: Record<string, unknown> = {
      title: product.title.en,
      slug: product.slug,
      category: product.category,
      price: product.price,
      mainImage: mainImageId,
      gallery: galleryItems,
      description: product.description.en,
    };

    if (product.category === "dresses") {
      const p = product as typeof product & {
        availableLengths: readonly string[];
        availableSizes: readonly string[];
      };
      data.availableLengths = [...p.availableLengths];
      data.availableSizes = [...p.availableSizes];
    }

    const created = await payload.create({
      collection: "products",
      data,
      locale: "en",
    });

    // Update French locale
    await payload.update({
      collection: "products",
      id: created.id,
      data: {
        title: product.title.fr,
        description: product.description.fr,
      },
      locale: "fr",
    });

    console.log(`  ✅ ${product.title.fr} — id ${created.id}`);
  }

  console.log("\n🎉 Seed complete — 12 products created");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
