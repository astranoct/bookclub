import type { Book } from '@/types/book';

export interface Meeting {
  /** ISO 8601 timestamp (UTC). */
  at: string;
  /** Where or how the club meets, such as a café or a call link. */
  note?: string;
}

export interface FinishedBook extends Book {
  /** ISO 8601 timestamp (UTC) of when the club finished the book. */
  finishedAt: string;
}

/** What owners store in a club's team preferences. Only owners can write these. */
export interface ClubPrefs {
  currentBook?: Book | null;
  meeting?: Meeting | null;
  finishedBooks?: FinishedBook[];
}

/** One member's saved page for the book the club was reading when they saved it. */
export interface ProgressEntry {
  page: number;
  bookKey: string;
}
