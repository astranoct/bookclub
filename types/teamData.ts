import { BookData } from "./BookData";

export interface TeamData {
    membersIds: string[];
    name: string;
    currentBook: BookData;
    previousBooks: BookData[];
}