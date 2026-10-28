import * as Linking from 'expo-linking';
import { Account, Client, ID, Teams } from 'react-native-appwrite';

import type { Book } from '@/types/book';
import { planLeave, type MembershipInfo } from '@/utils/clubs';
import type { InviteParams } from '@/utils/invites';
import { displayName } from '@/utils/people';

const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1';
// Where Appwrite sends invitees after they open the emailed link. Appwrite only allows
// URLs on hosts registered as platforms in the project, so this can be overridden.
const inviteUrl = process.env.EXPO_PUBLIC_INVITE_URL ?? Linking.createURL('invite');
const platform = process.env.EXPO_PUBLIC_APPWRITE_PLATFORM ?? 'com.boosterlong.bookclub';

if (!projectId) {
  throw new Error(
    'Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID. Copy .env.example to .env.local and fill it in.'
  );
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setPlatform(platform);
const account = new Account(client);
const teams = new Teams(client);

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

export function signOut() {
  return account.deleteSession('current');
}

export async function getClubs() {
  const { teams: clubs } = await teams.list();
  return clubs;
}

/** The first club the current user belongs to, or null if they have none. */
export async function getClub() {
  const clubs = await getClubs();
  return clubs[0] ?? null;
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
  return memberships.map((m) => ({
    id: m.$id,
    userId: m.userId,
    roles: m.roles,
    confirmed: m.confirm,
    name: displayName(m.userName),
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
