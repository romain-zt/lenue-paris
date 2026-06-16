"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MAX_SELECTION_ITEMS, SELECTION_STORAGE_KEY } from "./constants";
import type { SelectionItem } from "./types";

type SelectionContextValue = {
  items: SelectionItem[];
  count: number;
  isFull: boolean;
  isInSelection: (slug: string) => boolean;
  addItem: (item: SelectionItem) => boolean;
  removeItem: (slug: string) => void;
  clear: () => void;
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

function readStoredItems(): SelectionItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SELECTION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is SelectionItem =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as SelectionItem).slug === "string" &&
        typeof (row as SelectionItem).title === "string" &&
        typeof (row as SelectionItem).price === "number",
    );
  } catch {
    return [];
  }
}

function writeStoredItems(items: SelectionItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(items));
}

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SelectionItem[]>(() => readStoredItems());
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  useEffect(() => {
    writeStoredItems(items);
  }, [items]);

  const addItem = useCallback(
    (item: SelectionItem): boolean => {
      if (items.some((row) => row.slug === item.slug)) return false;
      if (items.length >= MAX_SELECTION_ITEMS) return false;
      setItems([...items, item]);
      return true;
    },
    [items],
  );

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((row) => row.slug !== slug));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<SelectionContextValue>(
    () => ({
      items,
      count: items.length,
      isFull: items.length >= MAX_SELECTION_ITEMS,
      isInSelection: (slug) => items.some((row) => row.slug === slug),
      addItem,
      removeItem,
      clear,
      isPanelOpen,
      openPanel,
      closePanel,
    }),
    [items, addItem, removeItem, clear, isPanelOpen, openPanel, closePanel],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection(): SelectionContextValue {
  const ctx = useContext(SelectionContext);
  if (!ctx) {
    throw new Error("useSelection must be used within SelectionProvider");
  }
  return ctx;
}
