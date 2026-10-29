import type { Book, SearchResult } from '@/types/book';

const SEARCH_URL = 'https://openlibrary.org/search.json';
const MAX_ALTERNATIVES = 4;

interface OpenLibraryDoc {
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  first_publish_year?: number;
  ratings_average?: number;
}

export function coverUrl(coverId: number | undefined, size: 'S' | 'M' | 'L' = 'L') {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : undefined;
}

export function toBook(doc: OpenLibraryDoc): Book {
  return {
    title: doc.title,
    author: doc.author_name?.[0] ?? 'Unknown author',
    coverId: doc.cover_i,
    pageCount: doc.number_of_pages_median,
    firstPublishYear: doc.first_publish_year,
    ratingsAverage: doc.ratings_average,
  };
}

/** Searches Open Library. Returns null when nothing matches. */
export async function searchForBook(query: string): Promise<SearchResult | null> {
  const params = new URLSearchParams({
    q: query,
    limit: String(MAX_ALTERNATIVES + 1),
    fields: 'title,author_name,cover_i,number_of_pages_median,first_publish_year,ratings_average',
  });

  const response = await fetch(`${SEARCH_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Open Library search failed (${response.status})`);
  }

  const { docs }: { docs: OpenLibraryDoc[] } = await response.json();
  if (docs.length === 0) {
    return null;
  }

  const [best, ...alternatives] = docs.map(toBook);
  return { best, alternatives };
}
