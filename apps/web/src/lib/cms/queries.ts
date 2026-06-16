import { getPayload } from "payload";
import config from "@payload-config";
import type { Page as PayloadPage } from "@/payload-types";
import type { ContentLocale, HomePageDto } from "./types";
import { mapHomePageBlocks } from "./blocks";

const HOME_SLUG = "home";

async function fetchHomePageDoc(locale: ContentLocale): Promise<PayloadPage | null> {
  const payload = await getPayload({ config });
  const query = {
    collection: "pages" as const,
    where: {
      slug: { equals: HOME_SLUG },
      _status: { equals: "published" as const },
    },
    locale,
    limit: 1,
    depth: 2,
  };

  const { docs } = await payload.find(query);
  if (docs[0]) return docs[0];

  if (locale !== "fr") {
    const { docs: frDocs } = await payload.find({ ...query, locale: "fr" });
    return frDocs[0] ?? null;
  }

  return null;
}

export async function getHomePage(locale: ContentLocale): Promise<HomePageDto | null> {
  try {
    const doc = await fetchHomePageDoc(locale);
    if (!doc?.blocks?.length) return null;

    return {
      id: doc.id,
      slug: doc.slug,
      blocks: mapHomePageBlocks(doc.blocks),
    };
  } catch {
    return null;
  }
}
