export interface MembershipInfo {
  id: string;
  userId: string;
  roles: string[];
  confirmed: boolean;
}

export type LeavePlan =
  | { action: 'delete-club' }
  | { action: 'leave'; promoteMembershipId?: string };

export function isOwner(member: Pick<MembershipInfo, 'roles'>) {
  return member.roles.includes('owner');
}

/**
 * Decides what leaving a club should do.
 * - Nobody else has joined: the club is deleted, since an empty club is useless.
 * - You are the only owner of a club that still has members: the longest-standing
 *   member is promoted first, so the club is never left without an owner.
 */
export function planLeave(memberships: MembershipInfo[], myUserId: string): LeavePlan {
  const others = memberships.filter((m) => m.userId !== myUserId && m.confirmed);
  if (others.length === 0) {
    return { action: 'delete-club' };
  }

  const me = memberships.find((m) => m.userId === myUserId);
  const otherOwnerExists = others.some(isOwner);
  if (me && isOwner(me) && !otherOwnerExists) {
    return { action: 'leave', promoteMembershipId: others[0].id };
  }
  return { action: 'leave' };
}

export type ShareTarget<T extends { id: string }> =
  | { kind: 'none' }
  | { kind: 'direct'; club: T }
  | { kind: 'ask' };

/**
 * Decides which club a newly chosen book should go to.
 * A club arrived at from its own card (`preferredId`) is used as-is, a user with a single
 * club has no real choice, and anyone in several clubs is asked.
 */
export function resolveShareTarget<T extends { id: string }>(
  clubs: T[],
  preferredId?: string
): ShareTarget<T> {
  if (clubs.length === 0) return { kind: 'none' };

  const preferred = preferredId ? clubs.find((c) => c.id === preferredId) : undefined;
  if (preferred) return { kind: 'direct', club: preferred };

  if (clubs.length === 1) return { kind: 'direct', club: clubs[0] };
  return { kind: 'ask' };
}

/**
 * The label for the button that puts a book into a club: owners set the current book while
 * everyone else suggests one. A club arrived at from its own page decides it on its own.
 */
export function shareButtonTitle(
  clubs: { id: string; isOwner: boolean }[],
  preferredId?: string
) {
  const preferred = preferredId ? clubs.find((c) => c.id === preferredId) : undefined;
  const scope = preferred ? [preferred] : clubs;

  if (scope.length === 0) return 'Add to a club';
  if (scope.every((c) => c.isOwner)) return 'Set as club book';
  if (scope.every((c) => !c.isOwner)) return 'Suggest to club';
  return 'Add to a club';
}

/**
 * The buttons shown under a chosen book. Owners set the club's book by default but can also
 * suggest instead, so choosing a book to suggest never replaces the current one by accident.
 * `suggestOnly` is used when the screen was opened from a "suggest a book" button.
 */
export function shareButtons(
  clubs: { id: string; isOwner: boolean }[],
  preferredId?: string,
  suggestOnly = false
): { primary: string; secondary: string | null } {
  if (suggestOnly) return { primary: 'Suggest to club', secondary: null };

  const preferred = preferredId ? clubs.find((c) => c.id === preferredId) : undefined;
  const scope = preferred ? [preferred] : clubs;
  return {
    primary: shareButtonTitle(clubs, preferredId),
    secondary: scope.some((c) => c.isOwner) ? 'Suggest instead' : null,
  };
}
