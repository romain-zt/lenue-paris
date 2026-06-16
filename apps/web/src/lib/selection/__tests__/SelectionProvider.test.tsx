import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { SelectionProvider, useSelection } from "../SelectionProvider";
import { MAX_SELECTION_ITEMS } from "../constants";

function wrapper({ children }: { children: ReactNode }) {
  return <SelectionProvider>{children}</SelectionProvider>;
}

describe("SelectionProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("caps selection at three unique pieces", () => {
    const { result } = renderHook(() => useSelection(), { wrapper });

    act(() => {
      expect(
        result.current.addItem({ slug: "a", title: "Piece A", price: 100 }),
      ).toBe(true);
    });
    act(() => {
      expect(
        result.current.addItem({ slug: "b", title: "Piece B", price: 200 }),
      ).toBe(true);
    });
    act(() => {
      expect(
        result.current.addItem({ slug: "c", title: "Piece C", price: 300 }),
      ).toBe(true);
    });
    act(() => {
      expect(
        result.current.addItem({ slug: "d", title: "Piece D", price: 400 }),
      ).toBe(false);
    });

    expect(result.current.count).toBe(MAX_SELECTION_ITEMS);
    expect(result.current.isFull).toBe(true);
  });

  it("dedupes by slug", () => {
    const { result } = renderHook(() => useSelection(), { wrapper });

    act(() => {
      result.current.addItem({ slug: "robe-camille", title: "Robe Camille", price: 490 });
    });
    act(() => {
      expect(
        result.current.addItem({ slug: "robe-camille", title: "Robe Camille", price: 490 }),
      ).toBe(false);
    });

    expect(result.current.count).toBe(1);
    expect(result.current.isInSelection("robe-camille")).toBe(true);
  });
});
