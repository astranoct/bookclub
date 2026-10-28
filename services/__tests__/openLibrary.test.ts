import { coverUrl, searchForBook, toBook } from '../openLibrary';

const doc = {
  title: 'Dune',
  author_name: ['Frank Herbert'],
  cover_i: 123,
  number_of_pages_median: 412,
  first_publish_year: 1965,
  ratings_average: 4.27,
};

function mockFetch(body: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({ ok, status, json: async () => body }) as jest.Mock;
}

describe('toBook', () => {
  it('maps an Open Library doc', () => {
    expect(toBook(doc)).toEqual({
      title: 'Dune',
      author: 'Frank Herbert',
      coverId: 123,
      pageCount: 412,
      firstPublishYear: 1965,
      ratingsAverage: 4.27,
    });
  });

  it('tolerates missing optional fields', () => {
    const book = toBook({ title: 'Mystery' });
    expect(book.author).toBe('Unknown author');
    expect(book.coverId).toBeUndefined();
  });
});

describe('coverUrl', () => {
  it('builds a cover URL, or undefined without an id', () => {
    expect(coverUrl(123, 'M')).toBe('https://covers.openlibrary.org/b/id/123-M.jpg');
    expect(coverUrl(undefined)).toBeUndefined();
  });
});

describe('searchForBook', () => {
  it('returns the best match and alternatives', async () => {
    mockFetch({ docs: [doc, { title: 'Dune Messiah' }] });
    const result = await searchForBook('dune');
    expect(result?.best.title).toBe('Dune');
    expect(result?.alternatives.map((b) => b.title)).toEqual(['Dune Messiah']);
  });

  it('url-encodes the query', async () => {
    mockFetch({ docs: [doc] });
    await searchForBook('a&b=c');
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('q=a%26b%3Dc');
  });

  it('returns null when nothing matches', async () => {
    mockFetch({ docs: [] });
    expect(await searchForBook('zzzz')).toBeNull();
  });

  it('throws on a failed request', async () => {
    mockFetch({}, false, 503);
    await expect(searchForBook('dune')).rejects.toThrow('503');
  });
});
