import {
  planLeave,
  resolveShareTarget,
  shareButtons,
  shareButtonTitle,
  type MembershipInfo,
} from '../clubs';

const member = (
  userId: string,
  roles: string[],
  confirmed = true
): MembershipInfo => ({ id: `m-${userId}`, userId, roles, confirmed });

describe('planLeave', () => {
  it('deletes the club when nobody else has joined', () => {
    expect(planLeave([member('me', ['owner'])], 'me')).toEqual({ action: 'delete-club' });
  });

  it('ignores pending invites when deciding whether anyone else is in the club', () => {
    const memberships = [member('me', ['owner']), member('invitee', ['member'], false)];
    expect(planLeave(memberships, 'me')).toEqual({ action: 'delete-club' });
  });

  it('promotes the next member when the only owner leaves', () => {
    const memberships = [member('me', ['owner']), member('a', ['member']), member('b', ['member'])];
    expect(planLeave(memberships, 'me')).toEqual({
      action: 'leave',
      promoteMembershipId: 'm-a',
    });
  });

  it('does not promote anyone when another owner exists', () => {
    const memberships = [member('me', ['owner']), member('a', ['owner']), member('b', ['member'])];
    expect(planLeave(memberships, 'me')).toEqual({ action: 'leave' });
  });

  it('lets a regular member leave without changes', () => {
    const memberships = [member('a', ['owner']), member('me', ['member'])];
    expect(planLeave(memberships, 'me')).toEqual({ action: 'leave' });
  });
});

describe('resolveShareTarget', () => {
  const a = { id: 'a', name: 'A' };
  const b = { id: 'b', name: 'B' };

  it('reports when there are no clubs', () => {
    expect(resolveShareTarget([])).toEqual({ kind: 'none' });
  });

  it('uses the only club without asking', () => {
    expect(resolveShareTarget([a])).toEqual({ kind: 'direct', club: a });
  });

  it('asks when there are several clubs', () => {
    expect(resolveShareTarget([a, b])).toEqual({ kind: 'ask' });
  });

  it('uses the preferred club when it is one of yours', () => {
    expect(resolveShareTarget([a, b], 'b')).toEqual({ kind: 'direct', club: b });
  });

  it('asks again if the preferred club is stale', () => {
    expect(resolveShareTarget([a, b], 'gone')).toEqual({ kind: 'ask' });
  });
});

describe('shareButtonTitle', () => {
  const owned = { id: 'a', isOwner: true };
  const joined = { id: 'b', isOwner: false };

  it('says set when you own every club and suggest when you own none', () => {
    expect(shareButtonTitle([owned])).toBe('Set as club book');
    expect(shareButtonTitle([joined])).toBe('Suggest to club');
  });

  it('is neutral for a mix of roles or no clubs', () => {
    expect(shareButtonTitle([owned, joined])).toBe('Add to a club');
    expect(shareButtonTitle([])).toBe('Add to a club');
  });

  it('follows the preferred club when one is given', () => {
    expect(shareButtonTitle([owned, joined], 'a')).toBe('Set as club book');
    expect(shareButtonTitle([owned, joined], 'b')).toBe('Suggest to club');
  });
});

describe('shareButtons', () => {
  const owned = { id: 'a', isOwner: true };
  const joined = { id: 'b', isOwner: false };

  it('lets an owner suggest instead of setting', () => {
    expect(shareButtons([owned])).toEqual({ primary: 'Set as club book', secondary: 'Suggest instead' });
  });

  it('offers only suggesting to someone who owns nothing', () => {
    expect(shareButtons([joined])).toEqual({ primary: 'Suggest to club', secondary: null });
  });

  it('offers the extra suggest button when any club in scope is owned', () => {
    expect(shareButtons([owned, joined]).secondary).toBe('Suggest instead');
    expect(shareButtons([owned, joined], 'b').secondary).toBeNull();
  });

  it('never sets the book when opened to suggest', () => {
    expect(shareButtons([owned, joined], 'a', true)).toEqual({
      primary: 'Suggest to club',
      secondary: null,
    });
  });
});
