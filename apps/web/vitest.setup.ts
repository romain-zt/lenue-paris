import { createElement } from "react";
import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: ReactNode;
  }) => createElement("a", { href, ...props }, children),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: ImgHTMLAttributes<HTMLImageElement>) =>
    createElement("img", { alt, src: src as string }),
}));
