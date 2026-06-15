import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VariantSelector } from "../VariantSelector";
import { WithIntl } from "@/test-utils/with-intl";
import type { DressLength } from "@/types/product";

describe("VariantSelector", () => {
  it("renders both length options", () => {
    render(<WithIntl><VariantSelector selected={null} onChange={() => {}} /></WithIntl>);
    expect(screen.getByText("Version longue")).toBeDefined();
    expect(screen.getByText("Version courte")).toBeDefined();
  });

  it("marks selected option as pressed", () => {
    render(<WithIntl><VariantSelector selected="longer" onChange={() => {}} /></WithIntl>);
    const btn = screen.getByRole("button", { name: "Version longue" });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("calls onChange when a length is clicked", () => {
    let called: DressLength | null = null;
    render(
      <WithIntl>
        <VariantSelector selected={null} onChange={(v) => { called = v; }} />
      </WithIntl>
    );
    fireEvent.click(screen.getByText("Version courte"));
    expect(called).toBe("shorter");
  });
});
