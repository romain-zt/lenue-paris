import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SizePicker } from "../SizePicker";
import { WithIntl } from "@/test-utils/with-intl";
import type { DressSize } from "@/types/product";

describe("SizePicker", () => {
  it("renders all five sizes", () => {
    render(<WithIntl><SizePicker selected={null} onChange={() => {}} /></WithIntl>);
    for (const size of ["XS", "S", "M", "L", "XL"]) {
      expect(screen.getByRole("button", { name: size })).toBeDefined();
    }
  });

  it("marks the selected size as pressed", () => {
    render(<WithIntl><SizePicker selected="M" onChange={() => {}} /></WithIntl>);
    expect(screen.getByRole("button", { name: "M" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("calls onChange when a size is clicked", () => {
    let called: DressSize | null = null;
    render(
      <WithIntl>
        <SizePicker selected={null} onChange={(s) => { called = s; }} />
      </WithIntl>
    );
    fireEvent.click(screen.getByRole("button", { name: "L" }));
    expect(called).toBe("L");
  });
});
