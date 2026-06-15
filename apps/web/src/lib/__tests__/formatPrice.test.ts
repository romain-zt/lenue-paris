import { describe, it, expect } from "vitest";
import { formatPrice } from "../formatPrice";

describe("formatPrice", () => {
  it("formats for fr, en, and ru without throwing", () => {
    expect(formatPrice(290, "fr")).toMatch(/290/);
    expect(formatPrice(290, "en")).toMatch(/290/);
    expect(formatPrice(290, "ru")).toMatch(/290/);
  });
});
