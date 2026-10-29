import { bookKey, currentPage, parsePage, progressPercent } from '../progress';

const dune = { title: 'Dune', author: 'Frank Herbert' };

describe('bookKey', () => {
  it('ignores case and surrounding spaces', () => {
    expect(bookKey({ title: ' DUNE ', author: 'frank herbert' })).toBe(bookKey(dune));
  });

  it('tells different books apart', () => {
    expect(bookKey(dune)).not.toBe(bookKey({ title: 'Dune Messiah', author: 'Frank Herbert' }));
  });
});

describe('progressPercent', () => {
  it('rounds and clamps', () => {
    expect(progressPercent(152, 304)).toBe(50);
    expect(progressPercent(400, 304)).toBe(100);
    expect(progressPercent(0, 304)).toBe(0);
  });

  it('is null when the page count is unknown', () => {
    expect(progressPercent(50, undefined)).toBeNull();
    expect(progressPercent(50, 0)).toBeNull();
  });
});

describe('parsePage', () => {
  it('accepts whole numbers, including zero', () => {
    expect(parsePage(' 42 ')).toEqual({ ok: true, page: 42 });
    expect(parsePage('0')).toEqual({ ok: true, page: 0 });
  });

  it('rejects anything else', () => {
    expect(parsePage('')).toMatchObject({ ok: false });
    expect(parsePage('4.5')).toMatchObject({ ok: false });
    expect(parsePage('-3')).toMatchObject({ ok: false });
    expect(parsePage('abc')).toMatchObject({ ok: false });
    expect(parsePage('10000')).toMatchObject({ ok: false });
  });
});

describe('currentPage', () => {
  it('counts progress only for the book being read now', () => {
    const entry = { page: 120, bookKey: bookKey(dune) };
    expect(currentPage(entry, dune)).toBe(120);
    expect(currentPage(entry, { title: 'Emma', author: 'Jane Austen' })).toBe(0);
  });

  it('is zero without progress or without a current book', () => {
    expect(currentPage(undefined, dune)).toBe(0);
    expect(currentPage({ page: 5, bookKey: bookKey(dune) }, null)).toBe(0);
  });
});
