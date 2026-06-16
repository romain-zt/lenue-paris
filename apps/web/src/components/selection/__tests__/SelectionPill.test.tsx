import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SelectionPanel } from "../SelectionPill";

vi.mock("@/lib/selection/SelectionProvider", () => ({
  useSelection: () => ({
    items: [],
    removeItem: vi.fn(),
    clear: vi.fn(),
    count: 1,
    isPanelOpen: false,
    openPanel: vi.fn(),
    closePanel: vi.fn(),
    addItem: vi.fn(),
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));

vi.mock("@/lib/whatsapp/config", () => ({ buildWhatsAppUrl: vi.fn(() => null) }));
vi.mock("@/lib/selection/buildMultiPieceWhatsAppMessage", () => ({
  buildMultiPieceWhatsAppMessage: vi.fn(() => ""),
}));

describe("SelectionPanel", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders null when open=false initially (not mounted)", () => {
    const { container } = render(<SelectionPanel open={false} onClose={onClose} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders in DOM when open=true", () => {
    render(<SelectionPanel open={true} onClose={onClose} />);
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("backdrop has opacity-0 initially when open=true (transition starts from hidden)", () => {
    render(<SelectionPanel open={true} onClose={onClose} />);
    const backdrop = screen.getByLabelText("closePanel");
    expect(backdrop.className).toContain("opacity-0");
  });

  it("sheet has translate-y-full initially when open=true (before animation frame)", () => {
    render(<SelectionPanel open={true} onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("translate-y-full");
  });

  it("has motion-reduce:!transition-none on backdrop and sheet", () => {
    render(<SelectionPanel open={true} onClose={onClose} />);
    const backdrop = screen.getByLabelText("closePanel");
    const dialog = screen.getByRole("dialog");
    expect(backdrop.className).toContain("motion-reduce:!transition-none");
    expect(dialog.className).toContain("motion-reduce:!transition-none");
  });

  it("keeps panel in DOM briefly during exit animation when closing", () => {
    vi.useFakeTimers();
    const { rerender } = render(<SelectionPanel open={true} onClose={onClose} />);
    expect(screen.getByRole("dialog")).toBeDefined();

    rerender(<SelectionPanel open={false} onClose={onClose} />);
    expect(screen.getByRole("dialog")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(349);
    });
    expect(screen.getByRole("dialog")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has aria-modal, role=dialog, and aria-labelledby when open", () => {
    render(<SelectionPanel open={true} onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("selection-panel-title");
  });
});
