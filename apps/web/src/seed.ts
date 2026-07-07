/**
 * CMS seed script — populates catalogue, pages, and site globals.
 *
 * Idempotent: reuses existing media by filename and upserts products by slug.
 *
 * Run:
 *   pnpm --filter web seed                  # default brand: lenue
 *   pnpm --filter web seed -- --brand=template
 */

import path from "path";
import { fileURLToPath } from "url";
import { loadBrandFixture, parseBrandArg, type BrandFixture } from "@repo/cms-data/fixtures";

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
    editorialCta: "Voir la collection",
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
    editorialCta: "See the collection",
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
    editorialCta: "Смотреть коллекцию",
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
      showCapsuleBadge: true,
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

const A_PROPOS_SLUG = "a-propos";
const CONTACT_SLUG = "contact";
const LIVRAISON_SLUG = "livraison";

const A_PROPOS_BODY: Record<ContentLocale, { title: string; body: string }> = {
  fr: {
    title: "Notre histoire",
    body: [
      "LÉNUE est née d'une recherche presque impossible.",
      "Celle d'une robe que l'on aurait envie de porter du matin jusqu'au soir.\nUne robe élégante sans être rigide.\nFéminine sans effort.\nSensuelle sans jamais en faire trop.",
      "Pendant des mois, nous avons cherché une matière capable d'offrir cette sensation rare : oublier que l'on porte une robe.",
      "Nous avons finalement choisi une viscose italienne d'une qualité exceptionnelle.\nLégère, fluide et respirante, elle accompagne le mouvement du corps sans jamais le contraindre.\nPar temps chaud, elle laisse la peau respirer.\nElle glisse sur la silhouette avec la douceur d'une seconde peau.",
      "C'est le genre de tissu que l'on touche une fois, puis une deuxième, puis une troisième.\nParce qu'il est difficile de résister à sa douceur.",
      "Nous avons imaginé des robes pour les journées d'été, les voyages, les dîners qui s'éternisent, les promenades au bord de la mer et les moments que l'on aimerait retenir un peu plus longtemps.",
      "Des robes dans lesquelles on se sent belle avant même de se regarder dans un miroir.",
      "Chaque imprimé a été choisi avec soin.\nChaque détail a été pensé pour traverser les saisons et les années.",
      "Nous ne croyons pas aux tendances qui disparaissent en quelques mois.\nNous croyons aux pièces que l'on garde, que l'on emporte partout avec soi et que l'on aime retrouver, année après année.",
      "LÉNUE est une invitation à ralentir.\nÀ profiter du soleil sur la peau.\nÀ se sentir libre, légère et infiniment féminine.",
    ].join("\n\n"),
  },
  en: {
    title: "Our story",
    body: [
      "LÉNUE began with an almost impossible search.",
      "A dress you'd want to wear from morning until night.\nElegant without being stiff.\nFeminine without effort.\nSensual without trying too hard.",
      "We spent months looking for a fabric that would feel like nothing at all.",
      "We found it in an Italian viscose of exceptional quality.\nLight, fluid, and breathable, it follows the body without ever constraining it.\nIn the heat, it lets the skin breathe.\nIt moves across the silhouette with the softness of a second skin.",
      "The kind of fabric you touch once, then again, then a third time.\nBecause it's hard to resist.",
      "We imagined dresses for summer days, for travel, for dinners that stretch late, for walks along the shore and for the moments you wish you could hold a little longer.",
      "Dresses that make you feel beautiful before you've even looked in the mirror.",
      "Every print was chosen with care.\nEvery detail was made to outlast the seasons and the years.",
      "We don't believe in trends that vanish after a few months.\nWe believe in pieces you keep, carry everywhere, and love to find again, year after year.",
      "LÉNUE is an invitation to slow down.\nTo feel the sun on your skin.\nTo feel free, light, and infinitely feminine.",
    ].join("\n\n"),
  },
  ru: {
    title: "Наша история",
    body: [
      "LÉNUE родился из почти невозможного поиска.",
      "Платья, которое хочется носить с утра до вечера.\nЭлегантного, но не строгого.\nЖенственного без усилий.\nЧувственного без излишества.",
      "Месяцами мы искали ткань, способную дарить редкое ощущение: забыть, что на тебе платье.",
      "Мы остановили выбор на итальянском вискозе исключительного качества.\nЛёгкий, текучий и дышащий, он следует движениям тела, не сковывая его.\nВ жару он позволяет коже дышать.\nСкользит по силуэту с мягкостью второй кожи.",
      "Это та ткань, которую хочется потрогать снова и снова.\nПотому что трудно устоять перед её нежностью.",
      "Мы придумывали платья для летних дней, поездок, затянувшихся ужинов, прогулок у моря и тех мгновений, которые хочется удержать чуть дольше.",
      "Платья, в которых чувствуешь себя красивой ещё до того, как посмотришь в зеркало.",
      "Каждый принт выбран с особой тщательностью.\nКаждая деталь продумана так, чтобы переживать сезоны и годы.",
      "Мы не верим в тренды, исчезающие через несколько месяцев.\nМы верим в вещи, которые хранят, берут с собой и с радостью находят вновь — год за годом.",
      "LÉNUE — это приглашение замедлиться.\nПочувствовать солнце на коже.\nОщутить себя свободной, лёгкой и бесконечно женственной.",
    ].join("\n\n"),
  },
};

async function seedAProposPage(payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> {
  console.log("\n📄 Syncing à-propos page");

  const existing = await payload.find({
    collection: "pages",
    where: { slug: { equals: A_PROPOS_SLUG } },
    limit: 1,
  });

  let pageId: number | string;

  if (existing.docs[0]) {
    pageId = existing.docs[0].id;
    console.log(`  ♻️  Reusing à-propos page → id ${pageId}`);
  } else {
    const doc = await payload.create({
      collection: "pages",
      data: {
        title: A_PROPOS_BODY.en.title,
        slug: A_PROPOS_SLUG,
        body: A_PROPOS_BODY.en.body,
        _status: "published",
      } as any,
      locale: "en",
      draft: false,
    });
    pageId = doc.id;
    console.log(`  ✅ Created à-propos page → id ${pageId}`);
  }

  for (const locale of PRODUCT_LOCALES) {
    await payload.update({
      collection: "pages",
      id: pageId,
      data: {
        title: A_PROPOS_BODY[locale].title,
        body: A_PROPOS_BODY[locale].body,
        _status: "published",
      } as any,
      locale,
      draft: false,
    });
  }

  console.log(`  ✅ Published à-propos page (${PRODUCT_LOCALES.join(", ")})`);
}

const CONTACT_BODY: Record<ContentLocale, { title: string; body: string }> = {
  fr: {
    title: "Contact",
    body: [
      "Lénue est une maison de robes — nous répondons nous-mêmes à chaque message.",
      "Pour découvrir la collection, choisir une taille ou passer commande, écrivez-nous sur WhatsApp. Nous vous accompagnons du premier échange jusqu'à la livraison.",
      "Nous ne tenons pas de marketplace : chaque robe est proposée directement, avec la même attention qu'en atelier.",
    ].join("\n\n"),
  },
  en: {
    title: "Contact",
    body: [
      "Lénue is a house of dresses — we answer every message ourselves.",
      "To explore the collection, choose a size, or place an order, write to us on WhatsApp. We guide you from the first exchange through to delivery.",
      "We are not a marketplace: each dress is offered directly, with the same care as in the atelier.",
    ].join("\n\n"),
  },
  ru: {
    title: "Контакты",
    body: [
      "Lénue — дом платьев; на каждое сообщение отвечаем лично.",
      "Чтобы познакомиться с коллекцией, выбрать размер или оформить заказ, напишите нам в WhatsApp. Мы сопровождаем вас от первого обращения до доставки.",
      "Мы не маркетплейс: каждое платье предлагается напрямую, с тем же вниманием, что и в ателье.",
    ].join("\n\n"),
  },
};

async function seedContactPage(payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> {
  console.log("\n📄 Syncing contact page");

  const existing = await payload.find({
    collection: "pages",
    where: { slug: { equals: CONTACT_SLUG } },
    limit: 1,
  });

  let pageId: number | string;

  if (existing.docs[0]) {
    pageId = existing.docs[0].id;
    console.log(`  ♻️  Reusing contact page → id ${pageId}`);
  } else {
    const doc = await payload.create({
      collection: "pages",
      data: {
        title: CONTACT_BODY.en.title,
        slug: CONTACT_SLUG,
        body: CONTACT_BODY.en.body,
        _status: "published",
      } as any,
      locale: "en",
      draft: false,
    });
    pageId = doc.id;
    console.log(`  ✅ Created contact page → id ${pageId}`);
  }

  for (const locale of PRODUCT_LOCALES) {
    await payload.update({
      collection: "pages",
      id: pageId,
      data: {
        title: CONTACT_BODY[locale].title,
        body: CONTACT_BODY[locale].body,
        _status: "published",
      } as any,
      locale,
      draft: false,
    });
  }

  console.log(`  ✅ Published contact page (${PRODUCT_LOCALES.join(", ")})`);
}

const LIVRAISON_BODY: Record<ContentLocale, { title: string; body: string }> = {
  fr: {
    title: "Livraison",
    body: [
      "Chaque robe Lénue est préparée avec soin, en petites séries. Nous expédions depuis la France vers l'Europe et au-delà.",
      "Après votre sélection, nous finalisons la commande avec vous sur WhatsApp : taille, adresse et délai vous sont confirmés en personne.",
      "Les frais et délais dépendent de votre pays de livraison — nous vous les précisons avant validation, sans surprise.",
    ].join("\n\n"),
  },
  en: {
    title: "Delivery",
    body: [
      "Each Lénue dress is prepared with care, in small runs. We ship from France across Europe and beyond.",
      "Once you have made your selection, we complete the order with you on WhatsApp — size, address, and timing confirmed in person.",
      "Shipping fees and lead times depend on your country; we share them clearly before you confirm, with no surprises.",
    ].join("\n\n"),
  },
  ru: {
    title: "Доставка",
    body: [
      "Каждое платье Lénue готовится с вниманием, небольшими сериями. Отправляем из Франции по Европе и за её пределы.",
      "После выбора мы оформляем заказ с вами в WhatsApp — размер, адрес и сроки согласуем лично.",
      "Стоимость и сроки зависят от страны доставки; мы сообщаем их до подтверждения, без сюрпризов.",
    ].join("\n\n"),
  },
};

async function seedLivraisonPage(payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> {
  console.log("\n📄 Syncing livraison page");

  const existing = await payload.find({
    collection: "pages",
    where: { slug: { equals: LIVRAISON_SLUG } },
    limit: 1,
  });

  let pageId: number | string;

  if (existing.docs[0]) {
    pageId = existing.docs[0].id;
    console.log(`  ♻️  Reusing livraison page → id ${pageId}`);
  } else {
    const doc = await payload.create({
      collection: "pages",
      data: {
        title: LIVRAISON_BODY.en.title,
        slug: LIVRAISON_SLUG,
        body: LIVRAISON_BODY.en.body,
        _status: "published",
      } as any,
      locale: "en",
      draft: false,
    });
    pageId = doc.id;
    console.log(`  ✅ Created livraison page → id ${pageId}`);
  }

  for (const locale of PRODUCT_LOCALES) {
    await payload.update({
      collection: "pages",
      id: pageId,
      data: {
        title: LIVRAISON_BODY[locale].title,
        body: LIVRAISON_BODY[locale].body,
        _status: "published",
      } as any,
      locale,
      draft: false,
    });
  }

  console.log(`  ✅ Published livraison page (${PRODUCT_LOCALES.join(", ")})`);
}

async function seedSiteSettings(
  payload: Awaited<ReturnType<typeof getPayload>>,
  brand: BrandFixture,
): Promise<void> {
  console.log("\n⚙️  Syncing site settings");
  await payload.updateGlobal({
    slug: "site-settings",
    data: {
      brandName: brand.brandName,
      brandWordmarkPrimary: brand.brandWordmarkPrimary,
      brandWordmarkSecondary: brand.brandWordmarkSecondary,
      instagramUrl: brand.instagramUrl || undefined,
      whatsappPhone: brand.whatsappPhone || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || undefined,
    } as any,
  });
  console.log(`  ✅ Site settings synced (${brand.slug})`);
}

export async function seed(brandSlug?: string) {
  const brand = loadBrandFixture(brandSlug ?? parseBrandArg());
  const payload = await getPayload({ config });

  console.log(`⚙  Payload initialized — brand: ${brand.slug}`);

  // 1. Create admin user if none exists
  const existingUsers = await payload.find({ collection: "users", limit: 1 });
  if (existingUsers.totalDocs === 0) {
    await payload.create({
      collection: "users",
      data: {
        email: brand.adminEmail,
        password: brand.adminPassword,
        name: brand.adminName,
      },
    });
    console.log(`👤 Admin user created — ${brand.adminEmail} / ${brand.adminPassword}`);
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

    const alt = `${product.title.fr} — ${brand.brandName}`;
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

    if (isPublicStorefrontSlug(product.slug)) {
      data.limitedSeries = true;
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
  await seedAProposPage(payload);
  await seedContactPage(payload);
  await seedLivraisonPage(payload);
  await seedSiteSettings(payload, brand);

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
