import { isValidEmail, parseInviteLink } from '../invites';

describe('isValidEmail', () => {
  it('accepts normal addresses and rejects junk', () => {
    expect(isValidEmail(' ada@example.com ')).toBe(true);
    expect(isValidEmail('ada@example')).toBe(false);
    expect(isValidEmail('not an email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('parseInviteLink', () => {
  const params = 'teamId=t1&membershipId=m1&userId=u1&secret=s3cr3t';

  it('parses a full link', () => {
    expect(parseInviteLink(`bookclub://invite?${params}`)).toEqual({
      teamId: 't1',
      membershipId: 'm1',
      userId: 'u1',
      secret: 's3cr3t',
    });
  });

  it('parses an https link with extra params and a fragment', () => {
    const link = `https://example.com/invite?foo=bar&${params}#done`;
    expect(parseInviteLink(link)?.membershipId).toBe('m1');
  });

  it('decodes encoded values', () => {
    const link = 'x://i?teamId=t&membershipId=m&userId=u&secret=a%2Bb%20c';
    expect(parseInviteLink(link)?.secret).toBe('a+b c');
  });

  it('returns null when anything is missing or malformed', () => {
    expect(parseInviteLink('bookclub://invite')).toBeNull();
    expect(parseInviteLink('bookclub://invite?teamId=t1&userId=u1')).toBeNull();
    expect(parseInviteLink('just some text')).toBeNull();
    expect(parseInviteLink('x://i?teamId=%E0%A4%A&membershipId=m&userId=u&secret=s')).toBeNull();
  });
});
