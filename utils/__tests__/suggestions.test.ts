import { parseBook, visibleSuggestions } from '../suggestions';

const book = (title: string) => ({ title, author: 'Someone' });
const suggestion = (title: string) => ({ membershipId: `m-${title}`, book: book(title) });

describe('parseBook', () => {
  it('parses a stored book', () => {
    expect(parseBook(JSON.stringify(book('Dune')))).toEqual(book('Dune'));
  });

  it('rejects empty, malformed, and wrongly shaped values', () => {
    expect(parseBook(undefined)).toBeNull();
    expect(parseBook('')).toBeNull();
    expect(parseBook('{not json')).toBeNull();
    expect(parseBook(JSON.stringify({ title: 5 }))).toBeNull();
  });
});

describe('visibleSuggestions', () => {
  const all = [suggestion('Dune'), suggestion('Emma'), suggestion('Ulysses')];

  it('hides the current book and finished books', () => {
    const prefs = {
      currentBook: book('Dune'),
      finishedBooks: [{ ...book('Emma'), finishedAt: '2026-01-01T00:00:00Z' }],
    };
    expect(visibleSuggestions(all, prefs).map((s) => s.book.title)).toEqual(['Ulysses']);
  });

  it('shows everything when nothing is taken', () => {
    expect(visibleSuggestions(all, {})).toHaveLength(3);
  });
});
