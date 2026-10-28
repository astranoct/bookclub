export interface Book {
  title: string;
  author: string;
  coverId?: number;
  pageCount?: number;
  firstPublishYear?: number;
  ratingsAverage?: number;
}

export interface SearchResult {
  best: Book;
  alternatives: Book[];
}
