import { describe, it, expect } from "vitest";
import { Products } from "./Products";

describe("Products collection schema", () => {
  it("has the correct slug", () => {
    expect(Products.slug).toBe("products");
  });

  it("has drafts enabled", () => {
    expect((Products.versions as { drafts: boolean }).drafts).toBe(true);
  });

  it("has required title field (localized)", () => {
    const title = Products.fields.find(
      (f) => "name" in f && f.name === "title"
    );
    expect(title).toBeDefined();
    expect((title as { localized?: boolean }).localized).toBe(true);
  });

  it("has category select with exactly three options", () => {
    const category = Products.fields.find(
      (f) => "name" in f && f.name === "category"
    );
    expect(category).toBeDefined();
    const opts = (category as { options: { value: string }[] }).options;
    expect(opts.map((o) => o.value)).toEqual(["dresses", "bags", "scarfs"]);
  });

  it("has price field with min 1", () => {
    const price = Products.fields.find(
      (f) => "name" in f && f.name === "price"
    );
    expect(price).toBeDefined();
    expect((price as { min?: number }).min).toBe(1);
  });

  it("has images array with minRows 1", () => {
    const images = Products.fields.find(
      (f) => "name" in f && f.name === "images"
    );
    expect(images).toBeDefined();
    expect((images as { minRows?: number }).minRows).toBe(1);
  });
});
