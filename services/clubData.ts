import {
  AppwriteException,
  Permission,
  Query,
  Role,
  type Models,
} from 'react-native-appwrite';

import { databaseId, databases, teams } from '@/services/appwrite';
import type { Book } from '@/types/book';
import type { ClubPrefs, Meeting, ProgressEntry } from '@/types/club';
import { finishBook } from '@/utils/clubPrefs';
import { bookKey } from '@/utils/progress';
import { parseBook, type Suggestion } from '@/utils/suggestions';

const progressCollectionId = process.env.EXPO_PUBLIC_APPWRITE_PROGRESS_COLLECTION_ID ?? 'progress';
const suggestionsCollectionId =
  process.env.EXPO_PUBLIC_APPWRITE_SUGGESTIONS_COLLECTION_ID ?? 'suggestions';

/* -------------------------------------------------------------------------------------------
 * Owner-written club data lives in the team's preferences, which only owners can change:
 * the current book, the next meeting, and the list of finished books.
 * ------------------------------------------------------------------------------------------- */

export async function getClubPrefs(clubId: string): Promise<ClubPrefs> {
  const prefs = await teams.getPrefs(clubId);
  return (prefs ?? {}) as ClubPrefs;
}

/** Merges into the existing preferences, since Appwrite replaces the whole object on update. */
export async function updateClubPrefs(clubId: string, patch: Partial<ClubPrefs>) {
  const current = await getClubPrefs(clubId);
  await teams.updatePrefs(clubId, { ...current, ...patch });
}

export function setCurrentBook(clubId: string, book: Book) {
  return updateClubPrefs(clubId, { currentBook: book });
}

export function setMeeting(clubId: string, meeting: Meeting | null) {
  return updateClubPrefs(clubId, { meeting });
}

/** Moves the club's current book into its finished list. */
export async function finishCurrentBook(clubId: string) {
  const prefs = await getClubPrefs(clubId);
  await teams.updatePrefs(clubId, finishBook(prefs));
}

/* -------------------------------------------------------------------------------------------
 * Member-written data lives in tables that every member can write to, with one row per club
 * membership (row ID = membership ID, since Appwrite hides other members' user IDs). Each row
 * is readable by the club's members and changeable only by the member it belongs to.
 * ------------------------------------------------------------------------------------------- */

function memberRowPermissions(clubId: string, userId: string) {
  return [
    Permission.read(Role.team(clubId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

async function upsertMemberRow(
  collectionId: string,
  membershipId: string,
  clubId: string,
  userId: string,
  data: object
) {
  try {
    await databases.updateDocument(databaseId, collectionId, membershipId, data);
  } catch (e) {
    if (!(e instanceof AppwriteException) || e.code !== 404) throw e;
    await databases.createDocument(
      databaseId,
      collectionId,
      membershipId,
      data,
      memberRowPermissions(clubId, userId)
    );
  }
}

interface MemberRef {
  membershipId: string;
  userId: string;
  clubId: string;
}

/** Reading progress, by membership ID. Returns an empty map if the table isn't available. */
export async function getProgress(membershipIds: string[]): Promise<Record<string, ProgressEntry>> {
  const ids = membershipIds.slice(0, 100);
  if (ids.length === 0) return {};
  try {
    const { documents } = await databases.listDocuments<
      { page?: number; bookKey?: string } & Models.Document
    >(databaseId, progressCollectionId, [Query.equal('$id', ids), Query.limit(ids.length)]);
    return Object.fromEntries(
      documents.map((d) => [d.$id, { page: Number(d.page) || 0, bookKey: d.bookKey ?? '' }])
    );
  } catch {
    return {};
  }
}

export function saveProgress({ membershipId, userId, clubId }: MemberRef, book: Book, page: number) {
  return upsertMemberRow(progressCollectionId, membershipId, clubId, userId, {
    clubId,
    bookKey: bookKey(book),
    page,
  });
}

/** Each member can have one suggestion at a time. Returns [] if the table isn't available. */
export async function getSuggestions(membershipIds: string[]): Promise<Suggestion[]> {
  const ids = membershipIds.slice(0, 100);
  if (ids.length === 0) return [];
  try {
    const { documents } = await databases.listDocuments<{ book?: string } & Models.Document>(
      databaseId,
      suggestionsCollectionId,
      [Query.equal('$id', ids), Query.limit(ids.length)]
    );
    return documents.flatMap((d) => {
      const book = parseBook(d.book);
      return book ? [{ membershipId: d.$id, book }] : [];
    });
  } catch {
    return [];
  }
}

export function saveSuggestion({ membershipId, userId, clubId }: MemberRef, book: Book) {
  return upsertMemberRow(suggestionsCollectionId, membershipId, clubId, userId, {
    clubId,
    book: JSON.stringify(book),
  });
}

export async function removeSuggestion(membershipId: string) {
  try {
    await databases.deleteDocument(databaseId, suggestionsCollectionId, membershipId);
  } catch (e) {
    if (!(e instanceof AppwriteException) || e.code !== 404) throw e;
  }
}
