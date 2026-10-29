import type { Book } from '@/types/book';
import type { ProgressEntry } from '@/types/club';

export const MAX_PAGE = 9999;

/**
 * Identifies a book for progress tracking. Open Library results carry no stable ID in our
 * Book type, so the title and author stand in for one.
 */
export function bookKey(book: Pick<Book, 'title' | 'author'>) {
  return `${book.title.trim().toLowerCase()}::${book.author.trim().toLowerCase()}`;
}

/** Percentage read, or null when the book's page count is unknown. */
export function progressPercent(page: number, pageCount?: number) {
  if (!pageCount || pageCount <= 0) return null;
  return Math.min(100, Math.max(0, Math.round((page / pageCount) * 100)));
}

export type PageParse = { ok: true; page: number } | { ok: false; error: string };

/**
 * Validates a typed page number. It is not capped at the page count, because Open Library's
 * count is a median across editions and a real copy can have more pages.
 */
export function parsePage(input: string): PageParse {
  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) return { ok: false, error: 'Enter a whole page number.' };
  const page = Number(trimmed);
  if (page > MAX_PAGE) return { ok: false, error: `Page numbers go up to ${MAX_PAGE}.` };
  return { ok: true, page };
}

/** A saved page only counts if it was recorded for the book the club is reading now. */
export function currentPage(entry: ProgressEntry | undefined, current: Book | null | undefined) {
  if (!entry || !current) return 0;
  return entry.bookKey === bookKey(current) ? entry.page : 0;
}
