import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SizePicker } from "../SizePicker";
import type { DressSize } from "@/types/product";

describe("SizePicker", () => {
  it("renders all five sizes", () => {
    render(<SizePicker selected={null} onChange={() => {}} />);
    for (const size of ["XS", "S", "M", "L", "XL"]) {
      expect(screen.getByRole("button", { name: size })).toBeDefined();
    }
  });

  it("marks the selected size as pressed", () => {
    render(<SizePicker selected="M" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "M" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("calls onChange when a size is clicked", () => {
    let called: DressSize | null = null;
    render(<SizePicker selected={null} onChange={(s) => { called = s; }} />);
    fireEvent.click(screen.getByRole("button", { name: "L" }));
    expect(called).toBe("L");
  });
});
