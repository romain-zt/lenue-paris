export interface PageCover {
  url: string;
  alt?: string | null;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  body?: string | null;
  cover?: PageCover | null;
}

export interface PagesResponse {
  docs: Page[];
}
