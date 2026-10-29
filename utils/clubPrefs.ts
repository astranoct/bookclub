import type { ClubPrefs, FinishedBook } from '@/types/club';

/** Team preferences are capped at 64kB, so the finished list keeps only the newest books. */
export const MAX_FINISHED_BOOKS = 100;

/**
 * Moves the current book to the top of the finished list and clears it.
 * Everything else in the preferences (such as the meeting) is left alone.
 */
export function finishBook(prefs: ClubPrefs, now = new Date()): ClubPrefs {
  const { currentBook } = prefs;
  if (!currentBook) throw new Error('There is no current book to finish.');

  const finished: FinishedBook = { ...currentBook, finishedAt: now.toISOString() };
  return {
    ...prefs,
    currentBook: null,
    finishedBooks: [finished, ...(prefs.finishedBooks ?? [])].slice(0, MAX_FINISHED_BOOKS),
  };
}
