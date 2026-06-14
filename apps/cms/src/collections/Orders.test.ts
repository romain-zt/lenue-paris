import { describe, expect, it } from "vitest";
import { Orders } from "./Orders";

describe("Orders collection", () => {
  const field = (name: string) =>
    Orders.fields.find((f) => "name" in f && f.name === name);

  it("allows public create (checkout form), restricts read to admins", () => {
    expect(Orders.access?.create?.({ req: { user: null } } as never)).toBe(true);
    expect(Orders.access?.read?.({ req: { user: null } } as never)).toBeFalsy();
    expect(Orders.access?.read?.({ req: { user: { id: "1" } } } as never)).toBe(true);
  });

  it("requires buyer contact and product relationship", () => {
    expect((field("customerName") as { required?: boolean }).required).toBe(true);
    expect((field("customerPhone") as { required?: boolean }).required).toBe(true);
    expect((field("product") as { required?: boolean }).required).toBe(true);
  });

  it("captures dress length variant with longer and shorter options", () => {
    const length = field("length") as {
      type?: string;
      options?: Array<{ value: string }>;
    };

    expect(length?.type).toBe("select");
    expect(length?.options?.map((option) => option.value)).toEqual(["longer", "shorter"]);
  });

  it("stores optional size text for dress orders", () => {
    expect((field("size") as { type?: string }).type).toBe("text");
  });

  it("requires EUR price snapshot at checkout", () => {
    const priceEur = field("priceEur") as {
      type?: string;
      required?: boolean;
      min?: number;
    };

    expect(priceEur?.type).toBe("number");
    expect(priceEur?.required).toBe(true);
    expect(priceEur?.min).toBe(0);
  });

  it("records buyer locale for admin reference", () => {
    const locale = field("locale") as {
      type?: string;
      options?: Array<{ value: string }>;
    };

    expect(locale?.type).toBe("select");
    expect(locale?.options?.map((option) => option.value)).toEqual(["fr", "en", "ru"]);
  });

  it("defaults order status to new", () => {
    expect((field("status") as { defaultValue?: string }).defaultValue).toBe("new");
  });

  it("lists key columns in admin default view", () => {
    expect(Orders.admin?.defaultColumns).toEqual([
      "customerName",
      "product",
      "length",
      "size",
      "priceEur",
      "status",
      "createdAt",
    ]);
  });
});
