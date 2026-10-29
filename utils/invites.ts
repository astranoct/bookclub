export interface InviteParams {
  teamId: string;
  membershipId: string;
  userId: string;
  secret: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

/**
 * Reads the four values Appwrite puts in an invite link's query string.
 * Accepts a full link or just the query part, and returns null if any are missing.
 */
export function parseInviteLink(link: string): InviteParams | null {
  const query = link.trim().split('#')[0].split('?')[1];
  if (!query) return null;

  const values: Record<string, string> = {};
  for (const pair of query.split('&')) {
    const [key, value = ''] = pair.split('=');
    try {
      values[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
    } catch {
      return null;
    }
  }

  const { teamId, membershipId, userId, secret } = values;
  return teamId && membershipId && userId && secret
    ? { teamId, membershipId, userId, secret }
    : null;
}
