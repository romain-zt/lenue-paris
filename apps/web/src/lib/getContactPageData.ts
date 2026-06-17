import { getPayload } from "payload";
import config from "@payload-config";
import type { Page as PayloadPage } from "@/payload-types";

export interface ContactPageData {
  title: string;
  body: string;
}

const CONTACT_SLUG = "contact";

export async function getContactPageData(locale: string = "fr"): Promise<ContactPageData> {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "pages",
      locale: locale as "fr" | "en" | "ru",
      fallbackLocale: "fr",
      where: {
        and: [
          { slug: { equals: CONTACT_SLUG } },
          { _status: { equals: "published" } },
        ],
      },
      depth: 0,
      limit: 1,
    });

    const page = result.docs[0] as PayloadPage | undefined;
    if (!page) {
      return { title: "", body: "" };
    }

    return {
      title: page.title ?? "",
      body: (page.body as string | null | undefined) ?? "",
    };
  } catch {
    return { title: "", body: "" };
  }
}
