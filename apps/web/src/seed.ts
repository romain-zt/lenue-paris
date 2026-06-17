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
import { getPayload } from "payload";
import config from "./payload.config";
import { PRODUCT_IMAGES } from "./lib/productImages";
import { PUBLIC_DRESS_SLUGS, isPublicStorefrontSlug } from "./lib/catalogue/storefrontCatalogue";

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return raw === "1" || raw.toLowerCase() === "true";
}

/** When true (default), skip overwriting a published home Page unless SEED_FORCE_HOME=1. */
export function shouldSkipHomeSeed(): boolean {
  if (envFlag("SEED_FORCE_HOME", false)) return false;
  return envFlag("SEED_SKIP_HOME_IF_PUBLISHED", true);
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
const HOME_PAGE_SLUG = "home";
const CATALOGUE_PAGE_SLUG = "catalogue";

const COLLECTION_DEFINITIONS = [
  {
    slug: "ete-2026",
    title: {
      fr: "Été 2026",
      en: "Summer 2026",
      ru: "Лето 2026",
    },
    productSlugs: [...PUBLIC_DRESS_SLUGS],
    published: true,
  },
  {
    slug: "robes-signature",
    title: {
      fr: "Robes signature",
      en: "Signature dresses",
      ru: "Фирменные платья",
    },
    productSlugs: [...PUBLIC_DRESS_SLUGS],
    published: true,
  },
] as const;

const CATALOGUE_PAGE_COPY = {
  fr: { title: "Catalogue", gridTitle: "Toute la collection" },
  en: { title: "Catalogue", gridTitle: "Full collection" },
  ru: { title: "Каталог", gridTitle: "Вся коллекция" },
} as const;

/** Featured carousel — signature robes only (client brief #2). */
const HOME_FEATURED_SLUGS = [...PUBLIC_DRESS_SLUGS] as const;

type ContentLocale = (typeof PRODUCT_LOCALES)[number];

const HOME_PAGE_COPY: Record<
  ContentLocale,
  {
    title: string;
    season: string;
    heroTagline: string;
    heroCta: string;
    featuredTitle: string;
    viewCollection: string;
    editorialLabel: string;
    editorialHeadline: string;
    editorialSubline: string;
    editorialBody: string;
    editorialCta: string;
    heroImageAlt: string;
    editorialImageAlt: string;
  }
> = {
  fr: {
    title: "Accueil",
    season: "Printemps · Été 2026",
    heroTagline: "Pour les moments que vous voulez garder.",
    heroCta: "Découvrir la collection",
    featuredTitle: "Notre sélection",
    viewCollection: "Voir la collection →",
    editorialLabel: "L'esprit Lénue",
    editorialHeadline: "Lénue, ce n'est pas s'habiller.",
    editorialSubline: "C'est se sentir soi-même.",
    editorialBody:
      "Chaque pièce est sélectionnée pour sa matière, sa coupe, et ce qu'elle dit de vous. Commandez en toute simplicité, via WhatsApp.",
    editorialCta: "Explorer la boutique",
    heroImageAlt: "Lénue Paris — collection Printemps Été 2026",
    editorialImageAlt: "Femme en robe Lénue Paris au Café de Flore",
  },
  en: {
    title: "Home",
    season: "Spring · Summer 2026",
    heroTagline: "For the moments you want to keep.",
    heroCta: "Explore the collection",
    featuredTitle: "Our selection",
    viewCollection: "View collection →",
    editorialLabel: "The Lénue spirit",
    editorialHeadline: "Lénue isn't about dressing.",
    editorialSubline: "It's about feeling like yourself.",
    editorialBody:
      "Every piece is chosen for its fabric, its cut, and what it says about you. Order simply, via WhatsApp.",
    editorialCta: "Explore the boutique",
    heroImageAlt: "Lénue Paris — Spring Summer 2026 collection",
    editorialImageAlt: "Woman in a Lénue Paris dress at Café de Flore",
  },
  ru: {
    title: "Главная",
    season: "Весна · Лето 2026",
    heroTagline: "Для моментов, которые хочется сохранить.",
    heroCta: "Смотреть коллекцию",
    featuredTitle: "Наша подборка",
    viewCollection: "Смотреть коллекцию →",
    editorialLabel: "Дух Lénue",
    editorialHeadline: "Lénue — это не просто одежда.",
    editorialSubline: "Это ощущение себя.",
    editorialBody:
      "Каждая вещь выбрана за материал, крой и то, что она говорит о вас. Заказывайте просто — через WhatsApp.",
    editorialCta: "Открыть бутик",
    heroImageAlt: "Lénue Paris — коллекция Весна Лето 2026",
    editorialImageAlt: "Женщина в платье Lénue Paris в Café de Flore",
  },
};

// ---------- Seed runner ----------

async function publishProductLocales(
  payload: Awaited<ReturnType<typeof getPayload>>,
  productId: number | string,
  product: (typeof PRODUCTS)[number],
  data: Record<string, unknown>,
) {
  const published = isPublicStorefrontSlug(product.slug);

  await payload.update({
    collection: "products",
    id: productId,
    data: { ...data, _status: published ? "published" : "draft" } as any,
    locale: "en",
    draft: !published,
  });

  await payload.update({
    collection: "products",
    id: productId,
    data: {
      title: product.title.fr,
      description: product.description.fr,
      _status: published ? "published" : "draft",
    },
    locale: "fr",
    draft: !published,
  });

  // v0: RU falls back to FR copy until dedicated translations exist.
  await payload.update({
    collection: "products",
    id: productId,
    data: {
      title: product.title.fr,
      description: product.description.fr,
      _status: published ? "published" : "draft",
    },
    locale: "ru",
    draft: !published,
  });
}

function buildHomeBlocks(
  locale: ContentLocale,
  heroImageId: number | string,
  editorialImageId: number | string,
  featuredProductIds: (number | string)[],
) {
  const copy = HOME_PAGE_COPY[locale];
  return [
    {
      blockType: "hero" as const,
      heroImage: heroImageId,
      season: copy.season,
      tagline: copy.heroTagline,
      ctaLabel: copy.heroCta,
      ctaLink: "/catalogue",
    },
    {
      blockType: "featuredProducts" as const,
      title: copy.featuredTitle,
      sourceType: "manual" as const,
      viewCollectionLabel: copy.viewCollection,
      products: featuredProductIds,
    },
    {
      blockType: "editorialStrip" as const,
      label: copy.editorialLabel,
      headline: copy.editorialHeadline,
      subline: copy.editorialSubline,
      body: copy.editorialBody,
      ctaLabel: copy.editorialCta,
      ctaLink: "/catalogue",
      image: editorialImageId,
    },
  ];
}

async function seedHomePage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  productIdBySlug: Record<string, number | string>,
  findOrUploadImage: (filename: string, alt: string) => Promise<number | string>,
) {
  console.log("\n📄 Syncing home page");

  const featuredProductIds = HOME_FEATURED_SLUGS.map((slug) => {
    const id = productIdBySlug[slug];
    if (id == null) {
      throw new Error(`Missing product id for featured slug: ${slug}`);
    }
    return id;
  });

  const heroImageId = await findOrUploadImage("hero.jpg", HOME_PAGE_COPY.fr.heroImageAlt);
  const editorialImageId = await findOrUploadImage(
    "cafe-de-flore.jpg",
    HOME_PAGE_COPY.fr.editorialImageAlt,
  );

  const existing = await payload.find({
    collection: "pages",
    where: { slug: { equals: HOME_PAGE_SLUG } },
    limit: 1,
  });

  if (existing.docs[0] && shouldSkipHomeSeed()) {
    const published = await payload.findByID({
      collection: "pages",
      id: existing.docs[0].id,
      locale: "fr",
      depth: 0,
      draft: false,
    });
    if (published._status === "published") {
      console.log(
        "  ⏭️  Skipping home page sync (published home exists — set SEED_FORCE_HOME=1 to overwrite)",
      );
      return existing.docs[0].id;
    }
  }

  let pageId: number | string;

  if (existing.docs[0]) {
    pageId = existing.docs[0].id;
    console.log(`  ♻️  Reusing home page → id ${pageId}`);
  } else {
    const doc = await payload.create({
      collection: "pages",
      data: {
        title: HOME_PAGE_COPY.en.title,
        slug: HOME_PAGE_SLUG,
        blocks: buildHomeBlocks("en", heroImageId, editorialImageId, featuredProductIds),
        _status: "published",
      } as any,
      locale: "en",
      draft: false,
    });
    pageId = doc.id;
    console.log(`  ✅ Created home page → id ${pageId}`);
  }

  for (const locale of PRODUCT_LOCALES) {
    await payload.update({
      collection: "pages",
      id: pageId,
      data: {
        title: HOME_PAGE_COPY[locale].title,
        blocks: buildHomeBlocks(locale, heroImageId, editorialImageId, featuredProductIds),
        _status: "published",
      } as any,
      locale,
      draft: false,
    });
    console.log(`  ✅ Published home page (${locale})`);
  }

  return pageId;
}

async function seedCollections(
  payload: Awaited<ReturnType<typeof getPayload>>,
  productIdBySlug: Record<string, number | string>,
): Promise<Record<string, number | string>> {
  const collectionIdBySlug: Record<string, number | string> = {};

  for (const def of COLLECTION_DEFINITIONS) {
    const productIds = def.productSlugs.map((slug) => {
      const id = productIdBySlug[slug];
      if (!id) throw new Error(`Missing product id for collection slug: ${slug}`);
      return id;
    });

    const existing = await payload.find({
      collection: "collections",
      where: { slug: { equals: def.slug } },
      limit: 1,
    });

    let collectionId: number | string;

    if (existing.docs[0]) {
      collectionId = existing.docs[0].id;
      console.log(`  ♻️  Reusing collection ${def.slug} → id ${collectionId}`);
    } else {
      const doc = await payload.create({
        collection: "collections",
        data: {
          title: def.title.en,
          slug: def.slug,
          products: productIds,
          _status: def.published ? "published" : "draft",
        } as any,
        locale: "en",
        draft: !def.published,
      });
      collectionId = doc.id;
      console.log(`  ✅ Created collection ${def.slug} → id ${collectionId}`);
    }

    for (const locale of PRODUCT_LOCALES) {
      await payload.update({
        collection: "collections",
        id: collectionId,
        data: {
          title: def.title[locale],
          products: productIds,
          _status: def.published ? "published" : "draft",
        } as any,
        locale,
        draft: !def.published,
      });
    }

    collectionIdBySlug[def.slug] = collectionId;
    console.log(`  ✅ Published collection ${def.slug} (${PRODUCT_LOCALES.join(", ")})`);
  }

  return collectionIdBySlug;
}

async function seedCataloguePage(payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> {
  const existing = await payload.find({
    collection: "pages",
    where: { slug: { equals: CATALOGUE_PAGE_SLUG } },
    limit: 1,
  });

  const buildBlocks = (locale: (typeof PRODUCT_LOCALES)[number]) => [
    {
      blockType: "productGrid" as const,
      title: CATALOGUE_PAGE_COPY[locale].gridTitle,
      sourceType: "all" as const,
    },
  ];

  let pageId: number | string;

  if (existing.docs[0]) {
    pageId = existing.docs[0].id;
    console.log(`  ♻️  Reusing catalogue page → id ${pageId}`);
  } else {
    const doc = await payload.create({
      collection: "pages",
      data: {
        title: CATALOGUE_PAGE_COPY.en.title,
        slug: CATALOGUE_PAGE_SLUG,
        blocks: buildBlocks("en"),
        _status: "published",
      } as any,
      locale: "en",
      draft: false,
    });
    pageId = doc.id;
    console.log(`  ✅ Created catalogue page → id ${pageId}`);
  }

  for (const locale of PRODUCT_LOCALES) {
    await payload.update({
      collection: "pages",
      id: pageId,
      data: {
        title: CATALOGUE_PAGE_COPY[locale].title,
        blocks: buildBlocks(locale),
        _status: "published",
      } as any,
      locale,
      draft: false,
    });
  }

  console.log(`  ✅ Published catalogue page (${PRODUCT_LOCALES.join(", ")})`);
}

export async function seed() {
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
  const productIdBySlug: Record<string, number | string> = {};

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
      productIdBySlug[product.slug] = existing.docs[0].id;
      updated++;
      const vis = isPublicStorefrontSlug(product.slug) ? "published" : "draft";
      console.log(`  ✅ Synced ${product.title.fr} (${vis}) — id ${existing.docs[0].id}`);
    } else {
      const published = isPublicStorefrontSlug(product.slug);
      const doc = await payload.create({
        collection: "products",
        data: { ...data, _status: published ? "published" : "draft" } as any,
        locale: "en",
        draft: !published,
      });
      await publishProductLocales(payload, doc.id, product, data);
      productIdBySlug[product.slug] = doc.id;
      created++;
      console.log(`  ✅ Created ${product.title.fr} (${published ? "published" : "draft"}) — id ${doc.id}`);
    }
  }

  await seedHomePage(payload, productIdBySlug, findOrUploadImage);
  await seedCollections(payload, productIdBySlug);
  await seedCataloguePage(payload);

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
