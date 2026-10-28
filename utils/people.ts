export const MAX_NAME_LENGTH = 128;

/** What to show for someone in the UI. Never falls back to an email address. */
export function displayName(name?: string | null) {
  return name?.trim() || 'Unnamed reader';
}

export function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] ?? '';
}

export function initialOf(name?: string | null) {
  return name?.trim().charAt(0).toUpperCase() || '?';
}

/** Returns an error message for an invalid name, or null if it is fine. */
export function validateName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter a name.';
  if (trimmed.length > MAX_NAME_LENGTH) return `Keep it under ${MAX_NAME_LENGTH} characters.`;
  return null;
}
