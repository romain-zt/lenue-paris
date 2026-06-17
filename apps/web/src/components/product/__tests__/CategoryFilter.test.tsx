import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryFilter } from "../CategoryFilter";
import { WithIntl } from "@/test-utils/with-intl";

describe("CategoryFilter", () => {
  it("renders all category options", () => {
    render(<WithIntl><CategoryFilter selected={null} onSelect={vi.fn()} /></WithIntl>);
    expect(screen.getByText("Tout")).toBeDefined();
    expect(screen.getByText("Robes")).toBeDefined();
  });

  it("calls onSelect with correct value when category clicked", () => {
    const onSelect = vi.fn();
    render(<WithIntl><CategoryFilter selected={null} onSelect={onSelect} /></WithIntl>);
    fireEvent.click(screen.getByText("Robes"));
    expect(onSelect).toHaveBeenCalledWith("dresses");
  });

  it('calls onSelect with null when "Tout" clicked', () => {
    const onSelect = vi.fn();
    render(<WithIntl><CategoryFilter selected={"dresses"} onSelect={onSelect} /></WithIntl>);
    fireEvent.click(screen.getByText("Tout"));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("marks selected category as active", () => {
    render(<WithIntl><CategoryFilter selected={"dresses"} onSelect={vi.fn()} /></WithIntl>);
    const dressesBtn = screen.getByText("Robes");
    expect(dressesBtn.getAttribute("aria-pressed")).toBe("true");
  });
});
