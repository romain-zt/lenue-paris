import { describe, expect, it } from "vitest";
import {
  DRESS_LENGTH_VARIANTS,
  DRESS_SIZE_OPTIONS,
  Products,
} from "./Products";

describe("Products collection", () => {
  const field = (name: string) =>
    Products.fields.find((f) => "name" in f && f.name === name);

  it("requires at least one image (minRows: 1)", () => {
    const images = field("images") as {
      type?: string;
      minRows?: number;
      fields?: Array<{ name: string; required?: boolean }>;
    };

    expect(images?.type).toBe("array");
    expect(images?.minRows).toBe(1);
    expect(images?.fields?.find((f) => f.name === "image")?.required).toBe(true);
  });

  it("localizes user-facing content but not the slug", () => {
    expect((field("name") as { localized?: boolean }).localized).toBe(true);
    expect((field("slug") as { localized?: boolean }).localized).toBeUndefined();
  });

  it("allows public read, requires auth for writes", () => {
    expect(Products.access?.read?.({ req: { user: null } } as never)).toBe(true);
    expect(Products.access?.create?.({ req: { user: null } } as never)).toBeFalsy();
  });

  it("exposes dress length variants with longer and shorter options", () => {
    const lengthVariants = field("lengthVariants") as {
      type?: string;
      hasMany?: boolean;
      options?: Array<{ value: string }>;
      admin?: { condition?: (data: unknown, siblingData: { category?: string }) => boolean };
    };

    expect(lengthVariants?.type).toBe("select");
    expect(lengthVariants?.hasMany).toBe(true);
    expect(lengthVariants?.options?.map((option) => option.value)).toEqual([
      ...DRESS_LENGTH_VARIANTS,
    ]);
    expect(lengthVariants?.admin?.condition?.(null, { category: "robe" })).toBe(true);
    expect(lengthVariants?.admin?.condition?.(null, { category: "sac" })).toBe(false);
  });

  it("exposes dress sizes as a fixed XS–XL select with defaults", () => {
    const sizes = field("sizes") as {
      type?: string;
      hasMany?: boolean;
      defaultValue?: string[];
      options?: Array<{ value: string }>;
      admin?: { condition?: (data: unknown, siblingData: { category?: string }) => boolean };
    };

    expect(sizes?.type).toBe("select");
    expect(sizes?.hasMany).toBe(true);
    expect(sizes?.defaultValue).toEqual([...DRESS_SIZE_OPTIONS]);
    expect(sizes?.options?.map((option) => option.value)).toEqual([
      ...DRESS_SIZE_OPTIONS,
    ]);
    expect(sizes?.admin?.condition?.(null, { category: "robe" })).toBe(true);
    expect(sizes?.admin?.condition?.(null, { category: "foulard" })).toBe(false);
  });

  it("has a relatedDress relationship field for bags and scarfs", () => {
    const relatedDress = field("relatedDress") as {
      type?: string;
      relationTo?: string;
      hasMany?: boolean;
      admin?: { condition?: (data: unknown, siblingData: { category?: string }) => boolean };
    };

    expect(relatedDress?.type).toBe("relationship");
    expect(relatedDress?.relationTo).toBe("products");
    expect(relatedDress?.hasMany).toBe(false);
    expect(relatedDress?.admin?.condition?.(null, { category: "sac" })).toBe(true);
    expect(relatedDress?.admin?.condition?.(null, { category: "foulard" })).toBe(true);
    expect(relatedDress?.admin?.condition?.(null, { category: "robe" })).toBe(false);
  });

  it("hides relatedDress for dress products", () => {
    const relatedDress = field("relatedDress") as {
      admin?: { condition?: (data: unknown, siblingData: { category?: string }) => boolean };
    };

    expect(relatedDress?.admin?.condition?.(null, { category: "robe" })).toBe(false);
    expect(relatedDress?.admin?.condition?.(null, { category: "autre" })).toBe(false);
  });
});
