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

export type ShareAction = 'set' | 'suggest';

/**
 * What choosing a book does for a club. Owners set the club's book, but can also suggest
 * instead, and everyone else can only suggest. `suggestOnly` is used when the screen was
 * opened from a "suggest a book" button, so that can never replace the current book.
 */
export function shareActions(
  isOwner: boolean,
  suggestOnly = false
): { primary: ShareAction; secondary: ShareAction | null } {
  if (!isOwner || suggestOnly) return { primary: 'suggest', secondary: null };
  return { primary: 'set', secondary: 'suggest' };
}
