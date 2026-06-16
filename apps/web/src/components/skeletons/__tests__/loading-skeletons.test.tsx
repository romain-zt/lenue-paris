import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HomePageSkeleton } from "../HomePageSkeleton";
import { CatalogueGridSkeleton } from "../CatalogueGridSkeleton";

describe("loading skeletons", () => {
  it("HomePageSkeleton exposes data-maison hero and catalogue-grid hooks", () => {
    const { container } = render(<HomePageSkeleton />);
    expect(container.querySelector('[data-maison="hero"]')).not.toBeNull();
    expect(container.querySelector('[data-maison="hero-image"]')).not.toBeNull();
    expect(container.querySelector('[data-maison="catalogue-grid"]')).not.toBeNull();
  });

  it("CatalogueGridSkeleton exposes data-maison catalogue-grid with two-column layout", () => {
    const { container } = render(<CatalogueGridSkeleton />);
    const grid = container.querySelector('[data-maison="catalogue-grid"]');
    expect(grid).not.toBeNull();
    expect(grid?.className).toMatch(/grid-cols-2/);
  });
});
