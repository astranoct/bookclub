import { planLeave, shareActions, type MembershipInfo } from '../clubs';

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

describe('shareActions', () => {
  it('lets an owner set the book or suggest instead', () => {
    expect(shareActions(true)).toEqual({ primary: 'set', secondary: 'suggest' });
  });

  it('lets a member only suggest', () => {
    expect(shareActions(false)).toEqual({ primary: 'suggest', secondary: null });
  });

  it('never sets the book when opened to suggest, even for an owner', () => {
    expect(shareActions(true, true)).toEqual({ primary: 'suggest', secondary: null });
  });
});
