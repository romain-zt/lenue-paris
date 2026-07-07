import { draftMode } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCmsClient } from "../client";
import type { ContentLocale, PatchDocumentParams, PatchDocumentResult } from "../types";

const WRITABLE_COLLECTIONS = new Set([
  "pages",
  "products",
  "collections",
]);

const WRITABLE_GLOBALS = new Set([
  "site-settings",
  "design-tokens",
]);

export async function patchDocument(
  params: PatchDocumentParams,
): Promise<PatchDocumentResult> {
  const { collection, id, data, locale = "fr", isGlobal = false, userId } = params;

  if (!userId) {
    return { success: false, error: "Authentification requise pour modifier le contenu" };
  }

  if (isGlobal) {
    if (!WRITABLE_GLOBALS.has(collection)) {
      return {
        success: false,
        error: `Le global "${collection}" n'est pas modifiable via l'assistant IA`,
      };
    }
  } else if (!WRITABLE_COLLECTIONS.has(collection)) {
    return {
      success: false,
      error: `La collection "${collection}" n'est pas modifiable via l'assistant IA`,
    };
  }

  try {
    const payload = await getCmsClient();
    const user = await payload.findByID({
      collection: "users",
      id: userId,
      overrideAccess: true,
    });

    if (isGlobal) {
      await payload.updateGlobal({
        slug: collection as Parameters<typeof payload.updateGlobal>[0]["slug"],
        data,
        locale: locale as ContentLocale,
        user,
        overrideAccess: false,
      });
    } else {
      if (!id) {
        return { success: false, error: "id requis pour les collections" };
      }
      await payload.update({
        collection: collection as Parameters<typeof payload.update>[0]["collection"],
        id: parseInt(id, 10),
        data,
        locale: locale as ContentLocale,
        user,
        overrideAccess: false,
      });
    }

    const dm = await draftMode();
    dm.enable();
    revalidatePath("/", "layout");

    return { success: true, updatedFields: Object.keys(data) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur de modification",
    };
  }
}
