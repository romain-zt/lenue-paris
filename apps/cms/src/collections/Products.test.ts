import { describe, expect, it } from "vitest";
import { Products } from "./Products";

describe("Products collection", () => {
  const field = (name: string) =>
    Products.fields.find((f) => "name" in f && f.name === name);

  it("localizes user-facing content but not the slug", () => {
    expect((field("name") as { localized?: boolean }).localized).toBe(true);
    expect((field("slug") as { localized?: boolean }).localized).toBeUndefined();
  });

  it("allows public read, requires auth for writes", () => {
    expect(Products.access?.read?.({ req: { user: null } } as never)).toBe(true);
    expect(Products.access?.create?.({ req: { user: null } } as never)).toBeFalsy();
  });
});

describe("Orders collection", () => {
  it("allows public create (checkout form), restricts read to admins", async () => {
    const { Orders } = await import("./Orders");
    expect(Orders.access?.create?.({ req: { user: null } } as never)).toBe(true);
    expect(Orders.access?.read?.({ req: { user: null } } as never)).toBeFalsy();
  });
});
