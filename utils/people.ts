export const MAX_NAME_LENGTH = 128;

const EMAIL_LIKE = /\S+@\S+\.\S+/;

/**
 * Appwrite fills in an account's name with its email address when none was given
 * (for example for accounts created by an invite), so an email-shaped name counts as unnamed.
 */
export function hasRealName(name?: string | null): name is string {
  const trimmed = name?.trim();
  return !!trimmed && !EMAIL_LIKE.test(trimmed);
}

/** What to show for someone in the UI. Never falls back to an email address. */
export function displayName(name?: string | null) {
  return hasRealName(name) ? name.trim() : 'Unnamed reader';
}

export function firstName(name?: string | null) {
  return hasRealName(name) ? name.trim().split(/\s+/)[0] : '';
}

export function initialOf(name?: string | null) {
  return hasRealName(name) ? name.trim().charAt(0).toUpperCase() : '?';
}

/** Returns an error message for an invalid name, or null if it is fine. */
export function validateName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter a name.';
  if (!hasRealName(trimmed)) return 'Use a name rather than an email address.';
  if (trimmed.length > MAX_NAME_LENGTH) return `Keep it under ${MAX_NAME_LENGTH} characters.`;
  return null;
}
