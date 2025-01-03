import { BookData } from "./BookData";

export interface SearchResult {
    possibleResults: BookData[];
    mostLikelyResult: BookData;
}