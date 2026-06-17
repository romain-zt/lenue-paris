import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CapsuleBadge } from "@/components/editorial/CapsuleBadge";

describe("CapsuleBadge", () => {
  it("renders editorial limited-series label with maison typography", () => {
    const html = renderToStaticMarkup(<CapsuleBadge>Série limitée</CapsuleBadge>);
    expect(html).toContain("Série limitée");
    expect(html).toContain("uppercase");
    expect(html).toContain("tracking-[0.35em]");
    expect(html).not.toContain("sale");
    expect(html).not.toContain("stock");
  });
});
