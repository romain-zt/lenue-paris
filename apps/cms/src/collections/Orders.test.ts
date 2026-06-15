import { describe, expect, it } from "vitest";
import { Orders } from "./Orders";

describe("Orders collection", () => {
  const field = (name: string) => Orders.fields.find((f) => "name" in f && f.name === name);

  it('has slug "orders"', () => {
    expect(Orders.slug).toBe("orders");
  });

  it("allows public create access", () => {
    expect(Orders.access?.create?.({ req: { user: null } } as never)).toBe(true);
    expect(Orders.access?.create?.({ req: { user: { id: "1" } } } as never)).toBe(true);
    expect(Orders.access?.create?.({} as never)).toBe(true);
  });

  it("restricts read access to authenticated users", () => {
    expect(Orders.access?.read?.({ req: { user: null } } as never)).toBe(false);
    expect(Orders.access?.read?.({ req: { user: { id: "1" } } } as never)).toBe(true);
  });

  it("marks product relationship as optional", () => {
    expect((field("product") as { required?: boolean }).required).toBe(false);
  });

  it("defines required order snapshot and buyer fields", () => {
    expect(field("price")).toBeDefined();
    expect(field("productTitle")).toBeDefined();
    expect(field("buyerName")).toBeDefined();
    expect(field("buyerContact")).toBeDefined();
  });
});
