import { finishBook, MAX_FINISHED_BOOKS } from '../clubPrefs';
import type { ClubPrefs } from '@/types/club';

const now = new Date('2026-11-01T12:00:00Z');
const dune = { title: 'Dune', author: 'Frank Herbert' };

describe('finishBook', () => {
  it('moves the current book to the top of the finished list', () => {
    const prefs: ClubPrefs = {
      currentBook: dune,
      finishedBooks: [{ title: 'Emma', author: 'Jane Austen', finishedAt: '2026-09-01T00:00:00Z' }],
    };
    const result = finishBook(prefs, now);
    expect(result.currentBook).toBeNull();
    expect(result.finishedBooks?.map((b) => b.title)).toEqual(['Dune', 'Emma']);
    expect(result.finishedBooks?.[0].finishedAt).toBe('2026-11-01T12:00:00.000Z');
  });

  it('leaves the meeting and other preferences alone', () => {
    const meeting = { at: '2026-11-06T19:00:00Z', note: 'The cafe' };
    expect(finishBook({ currentBook: dune, meeting }, now).meeting).toEqual(meeting);
  });

  it('works when nothing has been finished yet', () => {
    expect(finishBook({ currentBook: dune }, now).finishedBooks).toHaveLength(1);
  });

  it('keeps only the newest books once the cap is reached', () => {
    const finishedBooks = Array.from({ length: MAX_FINISHED_BOOKS }, (_, i) => ({
      title: `Book ${i}`,
      author: 'A',
      finishedAt: '2026-01-01T00:00:00Z',
    }));
    const result = finishBook({ currentBook: dune, finishedBooks }, now);
    expect(result.finishedBooks).toHaveLength(MAX_FINISHED_BOOKS);
    expect(result.finishedBooks?.[0].title).toBe('Dune');
  });

  it('refuses when there is no current book', () => {
    expect(() => finishBook({ currentBook: null }, now)).toThrow(/no current book/);
  });
});
