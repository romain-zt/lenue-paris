/**
 * Lénue Paris — CMS seed script
 *
 * Populates the database with a curated catalogue of dresses, bags and scarves
 * using product photos from apps/web/public/images/.
 *
 * Idempotent: reuses existing media by filename and upserts products by slug.
 *
 * Run:  pnpm --filter web seed
 */

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import fs from "fs";
import { Client } from "pg";
import { getPayload } from "payload";
import config from "./payload.config";
import { getPostgresPoolConfig } from "./lib/database";
import { PRODUCT_IMAGES } from "./lib/productImages";

/**
 * Drop columns whose Drizzle/Payload-desired type can no longer be
 * automatically cast from the existing PostgreSQL column type
 * (e.g. richText `body` was `text/varchar` and must become `jsonb`).
 *
 * Payload's dev schema push (drizzle-kit) does not emit a `USING …` clause,
 * so we surgically drop these columns first and let Payload recreate them
 * with the correct type on init.
 */
async function preInitSchemaCleanup() {
  const { connectionString, ssl } = getPostgresPoolConfig();
  if (!connectionString) return;

  const client = new Client({ connectionString, ssl });
  await client.connect();
  try {
    // Columns that need to become jsonb but were previously text-like.
    const targets: { table: string; column: string }[] = [
      { table: "pages_locales", column: "body" },
    ];

    for (const { table, column } of targets) {
      const { rows } = await client.query<{ data_type: string }>(
        `SELECT data_type FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
        [table, column],
      );
      const existing = rows[0]?.data_type;
      if (!existing) continue; // table/column doesn't exist yet — nothing to do
      if (existing === "jsonb") continue; // already correct

      console.log(
        `🧹 Dropping ${table}.${column} (was ${existing}) so Payload can recreate it as jsonb`,
      );
      await client.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}";`,
      );
    }
  } finally {
    await client.end();
  }
}

const IMAGES_DIR = path.resolve(__dirname, "../public/images");

// ---------- Image helpers ----------

function readImage(filename: string) {
  const filepath = path.join(IMAGES_DIR, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`Missing media file: ${filepath}`);
  }
  const data = fs.readFileSync(filepath);
  const stats = fs.statSync(filepath);
  const ext = path.extname(filename).toLowerCase();
  const mimetype =
    ext === ".png" ? ("image/png" as const) : ext === ".webp" ? ("image/webp" as const) : ("image/jpeg" as const);
  return {
    data,
    mimetype,
    name: filename,
    size: stats.size,
  };
}

// Map photo filenames to short aliases — must match files in apps/web/public/images/
// Product image filenames live in lib/productImages.ts (single source of truth).

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
  },
  // Aspirational complete look — always out of stock to drive desire + WhatsApp waitlist.
  {
    title: { en: "Élise Complete Look", fr: "Look Complet Élise" },
    slug: "look-elise-edition-limitee",
    category: "dresses" as const,
    price: 495,
    inStock: false,
    description: {
      en: "Our most coveted complete look — dress, bag and scarf styled as one. This limited edition is temporarily unavailable. Message us and we'll notify you first when it returns.",
      fr: "Notre look complet le plus convoité — robe, sac et foulard pensés ensemble. Cette édition limitée est momentanément indisponible. Écrivez-nous et vous serez prévenue en priorité lors de son retour.",
    },
    availableLengths: ["longer", "shorter"] as const,
    availableSizes: ["XS", "S", "M", "L"] as const,
  },
];

const PRODUCT_LOCALES = ["en", "fr", "ru"] as const;

// ---------- Seed runner ----------

async function publishProductLocales(
  payload: Awaited<ReturnType<typeof getPayload>>,
  productId: number | string,
  product: (typeof PRODUCTS)[number],
  data: Record<string, unknown>,
) {
  await payload.update({
    collection: "products",
    id: productId,
    data: data as any,
    locale: "en",
    draft: false,
  });

  await payload.update({
    collection: "products",
    id: productId,
    data: {
      title: product.title.fr,
      description: product.description.fr,
    },
    locale: "fr",
    draft: false,
  });

  // v0: RU falls back to FR copy until dedicated translations exist.
  await payload.update({
    collection: "products",
    id: productId,
    data: {
      title: product.title.fr,
      description: product.description.fr,
    },
    locale: "ru",
    draft: false,
  });
}

export async function seed() {
  await preInitSchemaCleanup();

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

  // 2. Upsert media and products (idempotent — no duplicates on re-run)
  const mediaCache: Record<string, number | string> = {};

  const findOrUploadImage = async (filename: string, alt: string): Promise<number | string> => {
    if (mediaCache[filename]) return mediaCache[filename];

    const existing = await payload.find({
      collection: "media",
      where: { filename: { equals: filename } },
      limit: 1,
    });
    if (existing.docs[0]) {
      mediaCache[filename] = existing.docs[0].id;
      await payload.update({
        collection: "media",
        id: existing.docs[0].id,
        data: { alt },
        locale: "fr",
      });
      console.log(`  ♻️  Reusing ${filename} → id ${existing.docs[0].id}`);
      return existing.docs[0].id;
    }

    const file = readImage(filename);
    const media = await payload.create({
      collection: "media",
      data: { alt },
      file,
      locale: "fr",
    });
    mediaCache[filename] = media.id;
    console.log(`  📷 Uploaded ${filename} → id ${media.id}`);
    return media.id;
  };

  let created = 0;
  let updated = 0;

  for (const product of PRODUCTS) {
    console.log(`\n📦 Syncing: ${product.title.fr}`);

    const images = PRODUCT_IMAGES[product.slug];
    if (!images) {
      throw new Error(`Missing image mapping for slug: ${product.slug}`);
    }

    const alt = `${product.title.fr} — Lénue Paris`;
    const mainImageId = await findOrUploadImage(images.main, alt);

    const galleryItems: { image: number | string }[] = [];
    for (const imgFile of images.gallery ?? []) {
      const id = await findOrUploadImage(imgFile, alt);
      galleryItems.push({ image: id });
    }

    const data: Record<string, unknown> = {
      title: product.title.en,
      slug: product.slug,
      category: product.category,
      price: product.price,
      inStock: "inStock" in product ? product.inStock !== false : true,
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

    const existing = await payload.find({
      collection: "products",
      where: { slug: { equals: product.slug } },
      limit: 1,
    });

    if (existing.docs[0]) {
      await publishProductLocales(payload, existing.docs[0].id, product, data);
      updated++;
      console.log(`  ✅ Published ${product.title.fr} — id ${existing.docs[0].id}`);
    } else {
      const doc = await payload.create({
        collection: "products",
        data: data as any,
        locale: "en",
        draft: false,
      });
      await publishProductLocales(payload, doc.id, product, data);
      created++;
      console.log(`  ✅ Created & published ${product.title.fr} — id ${doc.id}`);
    }
  }

  console.log(`\n🎉 Seed complete — ${created} created, ${updated} updated (${PRODUCT_LOCALES.join(", ")} locales)`);
}

const isSeedCliEntry =
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isSeedCliEntry) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
