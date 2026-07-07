import { describe, expect, it } from "vitest";
import { Products } from "@repo/payload-schema/collections";

describe("Products collection", () => {
  const field = (name: string) => Products.fields.find((f) => "name" in f && f.name === name);

  it('has slug "products"', () => {
    expect(Products.slug).toBe("products");
  });

  it("allows public read access", () => {
    expect(Products.access?.read?.({ req: { user: null } } as never)).toBe(true);
    expect(Products.access?.read?.({ req: { user: { id: "1" } } } as never)).toBe(true);
  });

  it("requires auth for create, update, and delete", () => {
    expect(Products.access?.create?.({ req: { user: null } } as never)).toBeFalsy();
    expect(Products.access?.create?.({ req: { user: { id: "1" } } } as never)).toBe(true);
    expect(Products.access?.update?.({ req: { user: null } } as never)).toBeFalsy();
    expect(Products.access?.update?.({ req: { user: { id: "1" } } } as never)).toBe(true);
    expect(Products.access?.delete?.({ req: { user: null } } as never)).toBeFalsy();
    expect(Products.access?.delete?.({ req: { user: { id: "1" } } } as never)).toBe(true);
  });

  it("localizes title and description", () => {
    expect((field("title") as { localized?: boolean }).localized).toBe(true);
    expect((field("description") as { localized?: boolean }).localized).toBe(true);
  });

  it('defines availableLengths with "longer" and "shorter" options', () => {
    const availableLengths = field("availableLengths") as {
      options?: { value: string }[];
    };
    expect(availableLengths).toBeDefined();
    const values = availableLengths.options?.map((o) => o.value);
    expect(values).toContain("longer");
    expect(values).toContain("shorter");
  });

  it("defines availableSizes with XS through XL options", () => {
    const availableSizes = field("availableSizes") as {
      options?: { value: string }[];
    };
    expect(availableSizes).toBeDefined();
    const values = availableSizes.options?.map((o) => o.value);
    expect(values).toEqual(["XS", "S", "M", "L", "XL"]);
  });

  it('defines pairings as a hasMany relationship to "products"', () => {
    const pairings = field("pairings") as {
      type?: string;
      hasMany?: boolean;
      relationTo?: string;
    };
    expect(pairings).toBeDefined();
    expect(pairings.type).toBe("relationship");
    expect(pairings.hasMany).toBe(true);
    expect(pairings.relationTo).toBe("products");
  });

  it("restricts pairings field read access to authenticated users", () => {
    const pairings = field("pairings") as {
      access?: { read?: (args: { req: { user: unknown } }) => boolean };
    };
    expect(pairings.access?.read?.({ req: { user: null } })).toBeFalsy();
    expect(pairings.access?.read?.({ req: { user: { id: "1" } } })).toBe(true);
  });
});
