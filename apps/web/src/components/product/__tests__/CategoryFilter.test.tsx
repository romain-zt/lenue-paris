import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryFilter } from "../CategoryFilter";

describe("CategoryFilter", () => {
  it("renders all category options", () => {
    render(<CategoryFilter selected={null} onSelect={vi.fn()} />);
    expect(screen.getByText("Tout")).toBeDefined();
    expect(screen.getByText("Robes")).toBeDefined();
    expect(screen.getByText("Sacs")).toBeDefined();
    expect(screen.getByText("Foulards")).toBeDefined();
  });

  it("calls onSelect with correct value when category clicked", () => {
    const onSelect = vi.fn();
    render(<CategoryFilter selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Robes"));
    expect(onSelect).toHaveBeenCalledWith("dresses");
  });

  it('calls onSelect with null when "Tout" clicked', () => {
    const onSelect = vi.fn();
    render(<CategoryFilter selected={"dresses"} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Tout"));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("marks selected category as active", () => {
    render(<CategoryFilter selected={"bags"} onSelect={vi.fn()} />);
    const bagsBtn = screen.getByText("Sacs");
    expect(bagsBtn.getAttribute("aria-pressed")).toBe("true");
  });
});
