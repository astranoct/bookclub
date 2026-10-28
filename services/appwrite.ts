import { Account, Client, ID, Teams } from 'react-native-appwrite';

import type { Book } from '@/types/book';

const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1';
const platform = process.env.EXPO_PUBLIC_APPWRITE_PLATFORM ?? 'com.boosterlong.bookclub';

if (!projectId) {
  throw new Error(
    'Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID. Copy .env.example to .env.local and fill it in.'
  );
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setPlatform(platform);
const account = new Account(client);
const teams = new Teams(client);

export async function getCurrentUser() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

export function signInAnonymously() {
  return account.createAnonymousSession();
}

export async function register(email: string, password: string) {
  await account.create(ID.unique(), email, password);
  return account.createEmailPasswordSession(email, password);
}

export function signIn(email: string, password: string) {
  return account.createEmailPasswordSession(email, password);
}

export function signOut() {
  return account.deleteSession('current');
}

/** The first club the current user belongs to, or null if they have none. */
export async function getClub() {
  const { teams: clubs } = await teams.list();
  return clubs[0] ?? null;
}

export function createClub(name: string) {
  return teams.create(ID.unique(), name, ['owner', 'member']);
}

export async function getClubMembers(clubId: string) {
  const { memberships } = await teams.listMemberships(clubId);
  return memberships;
}

export async function getCurrentBook(clubId: string): Promise<Book | null> {
  const prefs = await teams.getPrefs<{ currentBook?: Book }>(clubId);
  return prefs.currentBook ?? null;
}

export function setCurrentBook(clubId: string, book: Book) {
  return teams.updatePrefs(clubId, { currentBook: book });
}
