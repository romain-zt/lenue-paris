import { describe, expect, it } from "vitest";
import { Pages } from "@repo/payload-schema/collections";

describe("Pages collection", () => {
  const field = (name: string) => Pages.fields.find((f) => "name" in f && f.name === name);

  it("localizes user-facing content but not the slug identifier", () => {
    expect((field("title") as { localized?: boolean }).localized).toBe(true);
    expect((field("body") as { localized?: boolean }).localized).toBe(true);
    expect((field("slug") as { localized?: boolean }).localized).toBeUndefined();
  });

  it("uses field-level i18n on blocks, not block-level localization", () => {
    const blocksField = field("blocks") as {
      localized?: boolean;
      blocks?: Array<{ slug: string; fields: Array<{ name: string; localized?: boolean }> }>;
    };
    expect(blocksField.localized).toBeUndefined();
    const heroBlock = blocksField.blocks?.find((b) => b.slug === "hero");
    const season = heroBlock?.fields.find((f) => f.name === "season");
    expect(season?.localized).toBe(true);
  });

  it("denies writes to anonymous users", () => {
    expect(Pages.access?.create?.({ req: { user: null } } as never)).toBeFalsy();
    expect(Pages.access?.read?.({ req: { user: null } } as never)).toBe(true);
  });

  it("uses textarea (not richText) for body to avoid a Lexical serializer on the web", () => {
    expect((field("body") as { type: string }).type).toBe("textarea");
  });

  it("has a cover image upload field", () => {
    expect((field("cover") as { type: string }).type).toBe("upload");
  });
});
