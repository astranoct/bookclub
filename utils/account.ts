/** Guest accounts have no email or password, so they type this word to confirm instead. */
export const DELETE_PHRASE = 'DELETE';

export function emailsMatch(a?: string | null, b?: string | null) {
  const left = a?.trim().toLowerCase();
  const right = b?.trim().toLowerCase();
  return !!left && !!right && left === right;
}

interface DeleteConfirmationInput {
  email: string;
  password: string;
  phrase: string;
}

/**
 * Checks what the person typed before anything is deleted. Accounts with an email must retype
 * that email and their password. The password itself is verified by the server, not here.
 * Returns an error message, or null if the input is acceptable.
 */
export function validateDeleteConfirmation(
  accountEmail: string | null | undefined,
  { email, password, phrase }: DeleteConfirmationInput
) {
  if (accountEmail) {
    if (!emailsMatch(email, accountEmail)) return "That isn't the email on this account.";
    if (!password) return 'Enter your password.';
    return null;
  }
  return phrase.trim() === DELETE_PHRASE ? null : `Type ${DELETE_PHRASE} to confirm.`;
}
