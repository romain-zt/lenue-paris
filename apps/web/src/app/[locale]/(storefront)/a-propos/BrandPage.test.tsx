import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandPageContent } from "./BrandPageContent";
import Loading from "./loading";
import NotFound from "./not-found";

describe("BrandPageContent", () => {
  it("renders title from props", () => {
    render(<BrandPageContent title="Notre histoire" body="Hello" cover={null} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Notre histoire");
  });

  it("renders body paragraphs split by newlines", () => {
    const { container } = render(<BrandPageContent title="Notre histoire" body="First para\n\nSecond para" cover={null} />);
    expect(container.textContent).toContain("First para");
    expect(container.textContent).toContain("Second para");
  });

  it("renders nothing when title is empty (no CMS content)", () => {
    render(<BrandPageContent title="" body="" cover={null} />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("renders without cover image when cover is null", () => {
    render(<BrandPageContent title="Notre histoire" body="Hello" cover={null} />);
    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("BrandPageLoading", () => {
  it("loading.tsx renders skeleton", () => {
    render(<Loading />);
    expect(screen.getByTestId("loading-skeleton")).toBeDefined();
  });
});

describe("BrandPageNotFound", () => {
  it("not-found.tsx renders back link", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /Retour à la boutique/i });
    expect(link.getAttribute("href")).toBe("/");
  });
});
