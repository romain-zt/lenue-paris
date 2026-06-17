import { describe, it, expect } from "vitest";
import { STOREFRONT_NAV_LINKS, STOREFRONT_NAV_HREFS } from "../storefrontNav";

describe("storefrontNav (client brief #7)", () => {
  it("exposes exactly four buyer-facing links in maison order", () => {
    expect(STOREFRONT_NAV_LINKS).toHaveLength(4);
    expect(STOREFRONT_NAV_HREFS).toEqual([
      "/catalogue",
      "/a-propos",
      "/livraison",
      "/contact",
    ]);
  });

  it("does not reference sac or foulard category routes", () => {
    const joined = STOREFRONT_NAV_HREFS.join(" ");
    expect(joined).not.toMatch(/sac|foulard|bag|scarf/i);
  });
});
