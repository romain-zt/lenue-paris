import { describe, expect, it } from "vitest";
import { getPayload } from "payload";
import config from "@payload-config";
import { seed } from "../seed";

const FEATURED_COUNT = 6;
const HOME_SLUG = "home";

const hasDb = Boolean(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL);

function countFeaturedProductsInPage(page: unknown): number {
  if (!page || typeof page !== "object") return 0;
  const blocks = (page as { blocks?: unknown[] }).blocks;
  if (!Array.isArray(blocks)) return 0;

  const featuredBlock = blocks.find(
    (block) =>
      block &&
      typeof block === "object" &&
      (block as { blockType?: string }).blockType === "featuredProducts",
  );

  if (!featuredBlock || typeof featuredBlock !== "object") return 0;
  const products = (featuredBlock as { products?: unknown[] }).products;
  return Array.isArray(products) ? products.length : 0;
}

describe("seed idempotency", () => {
  it.skipIf(!hasDb)(
    "running seed twice keeps a single published home page with stable featured relations",
    async () => {
      if (process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
        process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
      }
      if (!process.env.PAYLOAD_SECRET) {
        process.env.PAYLOAD_SECRET = "test-secret-for-seed-idempotency";
      }

      await seed();

      const payload = await getPayload({ config });

      const afterFirst = await payload.find({
        collection: "pages",
        where: { slug: { equals: HOME_SLUG } },
        limit: 10,
        depth: 1,
        locale: "fr",
      });

      expect(afterFirst.totalDocs).toBe(1);
      const homeId = afterFirst.docs[0]?.id;
      expect(homeId).toBeDefined();

      const featuredCountFirst = countFeaturedProductsInPage(afterFirst.docs[0]);
      expect(featuredCountFirst).toBe(FEATURED_COUNT);

      await seed();

      const afterSecond = await payload.find({
        collection: "pages",
        where: { slug: { equals: HOME_SLUG } },
        limit: 10,
        depth: 1,
        locale: "fr",
      });

      expect(afterSecond.totalDocs).toBe(1);
      expect(afterSecond.docs[0]?.id).toBe(homeId);

      const featuredCountSecond = countFeaturedProductsInPage(afterSecond.docs[0]);
      expect(featuredCountSecond).toBe(featuredCountFirst);

      for (const locale of ["en", "fr", "ru"] as const) {
        const localized = await payload.findByID({
          collection: "pages",
          id: homeId!,
          locale,
          depth: 0,
        });
        expect(localized._status).toBe("published");
        expect(Array.isArray(localized.blocks)).toBe(true);
        expect(localized.blocks!.length).toBe(3);
      }
    },
    180_000,
  );
});
