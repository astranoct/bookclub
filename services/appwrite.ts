import * as Linking from 'expo-linking';
import {
  Account,
  AppwriteException,
  Client,
  Databases,
  ID,
  Permission,
  Query,
  Role,
  Teams,
  type Models,
} from 'react-native-appwrite';

import type { Book } from '@/types/book';
import { planLeave, type MembershipInfo } from '@/utils/clubs';
import type { InviteParams } from '@/utils/invites';
import { hasRealName, resolveMemberName } from '@/utils/people';

const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1';
// Where Appwrite sends invitees after they open the emailed link. Appwrite only allows
// URLs on hosts registered as platforms in the project, so this can be overridden.
const inviteUrl = process.env.EXPO_PUBLIC_INVITE_URL ?? Linking.createURL('invite');
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? 'bookclub';
const profilesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID ?? 'profiles';
const platform = process.env.EXPO_PUBLIC_APPWRITE_PLATFORM ?? 'com.boosterlong.bookclub';

if (!projectId) {
  throw new Error(
    'Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID. Copy .env.example to .env.local and fill it in.'
  );
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setPlatform(platform);
const account = new Account(client);
const teams = new Teams(client);
const databases = new Databases(client);

/**
 * Verifies the endpoint, project ID and registered platform are all correct.
 * react-native-appwrite 0.5 predates `client.ping()` (newer SDKs need Expo SDK 53+),
 * so this makes the same request ping() does.
 */
export async function pingAppwrite() {
  await client.call('get', new URL(`${endpoint}/ping`));
}

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

export function updateName(name: string) {
  return account.updateName(name);
}

/**
 * Display names live in a `profiles` collection (one document per user, ID = user ID) because
 * Appwrite's membership names can come back blank for other members. Documents hold a name only.
 */
export async function saveProfile(userId: string, name: string) {
  try {
    await databases.updateDocument(databaseId, profilesCollectionId, userId, { name });
  } catch (e) {
    if (!(e instanceof AppwriteException) || e.code !== 404) throw e;
    await databases.createDocument(databaseId, profilesCollectionId, userId, { name }, [
      Permission.read(Role.users()),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ]);
  }
}

let lastSyncedProfile = '';

/** Makes sure an existing account's name is in the profiles collection. Best effort. */
export async function syncProfile(user: { id: string; name: string }) {
  if (!hasRealName(user.name)) return;
  const key = `${user.id}:${user.name}`;
  if (key === lastSyncedProfile) return;

  try {
    const profile = await databases.getDocument<{ name?: string } & Models.Document>(
      databaseId,
      profilesCollectionId,
      user.id
    );
    if (profile.name !== user.name) await saveProfile(user.id, user.name);
    lastSyncedProfile = key;
  } catch (e) {
    if (e instanceof AppwriteException && e.code === 404) {
      try {
        await saveProfile(user.id, user.name);
        lastSyncedProfile = key;
      } catch {
        // Profiles aren't set up yet; names simply stay private until they are.
      }
    }
  }
}

/** Display names by user ID. Returns an empty map if the collection is unavailable. */
export async function getProfileNames(userIds: string[]): Promise<Record<string, string>> {
  const ids = userIds.slice(0, 100);
  if (ids.length === 0) return {};
  try {
    const { documents } = await databases.listDocuments<{ name?: string } & Models.Document>(
      databaseId,
      profilesCollectionId,
      [Query.equal('$id', ids), Query.limit(ids.length)]
    );
    return Object.fromEntries(documents.map((d) => [d.$id, d.name ?? '']));
  } catch {
    return {};
  }
}

export function signOut() {
  return account.deleteSession('current');
}

export async function getClubs() {
  const { teams: clubs } = await teams.list();
  return clubs;
}

export function createClub(name: string) {
  return teams.create(ID.unique(), name, ['owner', 'member']);
}

export function getClubById(clubId: string) {
  return teams.get(clubId);
}

export interface ClubMember extends MembershipInfo {
  /** Display name only. The member's email is deliberately never exposed. */
  name: string;
}

export async function getClubMembers(clubId: string): Promise<ClubMember[]> {
  const { memberships } = await teams.listMemberships(clubId);
  const profileNames = await getProfileNames(memberships.map((m) => m.userId));
  return memberships.map((m) => ({
    id: m.$id,
    userId: m.userId,
    roles: m.roles,
    confirmed: m.confirm,
    name: resolveMemberName(profileNames[m.userId], m.userName),
  }));
}

/** Emails the invitee a link. Only club owners can do this. */
export function inviteToClub(clubId: string, email: string) {
  return teams.createMembership(clubId, ['member'], email.trim(), undefined, undefined, inviteUrl);
}

export function acceptInvite({ teamId, membershipId, userId, secret }: InviteParams) {
  return teams.updateMembershipStatus(teamId, membershipId, userId, secret);
}

/**
 * Leaves a club. If you are the last member the club is deleted, and if you are its only
 * owner, ownership passes to the longest-standing member first.
 */
export async function leaveClub(clubId: string): Promise<'left' | 'deleted'> {
  const [me, members] = await Promise.all([account.get(), getClubMembers(clubId)]);
  const plan = planLeave(members, me.$id);

  if (plan.action === 'delete-club') {
    await teams.delete(clubId);
    return 'deleted';
  }

  if (plan.promoteMembershipId) {
    await teams.updateMembership(clubId, plan.promoteMembershipId, ['owner', 'member']);
  }
  const mine = members.find((m) => m.userId === me.$id);
  if (mine) {
    await teams.deleteMembership(clubId, mine.id);
  }
  return 'left';
}

export async function getCurrentBook(clubId: string): Promise<Book | null> {
  const prefs = await teams.getPrefs<{ currentBook?: Book }>(clubId);
  return prefs.currentBook ?? null;
}

export function setCurrentBook(clubId: string, book: Book) {
  return teams.updatePrefs(clubId, { currentBook: book });
}
