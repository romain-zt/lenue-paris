import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddToSelectionButton } from "../AddToSelectionButton";

const mockAddItem = vi.fn().mockReturnValue(true);
const mockIsInSelection = vi.fn().mockReturnValue(false);

vi.mock("@/lib/selection/SelectionProvider", () => ({
  useSelection: () => ({
    items: [],
    count: 0,
    isFull: false,
    isInSelection: mockIsInSelection,
    addItem: mockAddItem,
    removeItem: vi.fn(),
    clear: vi.fn(),
    isPanelOpen: false,
    openPanel: vi.fn(),
    closePanel: vi.fn(),
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockItem = {
  slug: "robe-blanche",
  title: "Robe Blanche",
  price: 290,
};

describe("AddToSelectionButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsInSelection.mockReturnValue(false);
    mockAddItem.mockReturnValue(true);
  });

  it("renders add label when not in selection", () => {
    render(<AddToSelectionButton item={mockItem} />);
    expect(screen.getByRole("button", { name: "add" })).toBeDefined();
  });

  it("renders inSelection quiet label when already in selection", () => {
    mockIsInSelection.mockReturnValue(true);
    render(<AddToSelectionButton item={mockItem} />);
    const button = screen.getByRole("button", { name: "inSelection" });
    expect(button).toBeDefined();
    expect(button.className).toContain("text-stone-400");
  });

  it("calls addItem on click when not selected", () => {
    render(<AddToSelectionButton item={mockItem} />);
    fireEvent.click(screen.getByRole("button", { name: "add" }));
    expect(mockAddItem).toHaveBeenCalledWith({
      slug: mockItem.slug,
      title: mockItem.title,
      price: mockItem.price,
      size: null,
      length: null,
    });
  });

  it("does not call addItem when already selected", () => {
    mockIsInSelection.mockReturnValue(true);
    render(<AddToSelectionButton item={mockItem} />);
    fireEvent.click(screen.getByRole("button", { name: "inSelection" }));
    expect(mockAddItem).not.toHaveBeenCalled();
  });
});
