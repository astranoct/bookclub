import type { Book } from '@/types/book';
import type { ClubPrefs } from '@/types/club';
import { bookKey } from '@/utils/progress';

export interface Suggestion {
  membershipId: string;
  book: Book;
}

/** Parses a stored suggestion, returning null if it isn't a usable book. */
export function parseBook(json: string | undefined | null): Book | null {
  if (!json) return null;
  try {
    const value = JSON.parse(json);
    return typeof value?.title === 'string' && typeof value?.author === 'string' ? value : null;
  } catch {
    return null;
  }
}

/** Hides suggestions for books the club is reading now or has already finished. */
export function visibleSuggestions(suggestions: Suggestion[], prefs: ClubPrefs) {
  const taken = new Set((prefs.finishedBooks ?? []).map(bookKey));
  if (prefs.currentBook) taken.add(bookKey(prefs.currentBook));
  return suggestions.filter((s) => !taken.has(bookKey(s.book)));
}
