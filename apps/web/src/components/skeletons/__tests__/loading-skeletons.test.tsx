import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HomePageSkeleton } from "../HomePageSkeleton";
import { CatalogueGridSkeleton } from "../CatalogueGridSkeleton";

describe("loading skeletons", () => {
  it("HomePageSkeleton exposes skeleton hooks distinct from live hero instrumentation", () => {
    const { container } = render(<HomePageSkeleton />);
    expect(container.querySelector('[data-maison="hero-skeleton"]')).not.toBeNull();
    expect(container.querySelector('[data-maison="hero-skeleton-image"]')).not.toBeNull();
    expect(container.querySelector('[data-maison="catalogue-grid"]')).not.toBeNull();
    expect(container.querySelector('[data-maison="hero"]')).toBeNull();
  });

  it("CatalogueGridSkeleton exposes data-maison catalogue-grid with two-column layout", () => {
    const { container } = render(<CatalogueGridSkeleton />);
    const grid = container.querySelector('[data-maison="catalogue-grid"]');
    expect(grid).not.toBeNull();
    expect(grid?.className).toMatch(/grid-cols-2/);
  });
});
