export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 256;
export const RECOVERY_CODE_LENGTH = 6;

/** Returns an error message for a new password that can't be used, or null if it is fine. */
export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Keep it under ${MAX_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirmation) return "Those passwords don't match.";
  return null;
}

/** Keeps just the digits, so a code pasted with spaces or dashes ("123 456") still works. */
export function normalizeRecoveryCode(input: string) {
  return input.replace(/\D/g, '').slice(0, RECOVERY_CODE_LENGTH);
}

export function isCompleteRecoveryCode(input: string) {
  return normalizeRecoveryCode(input).length === RECOVERY_CODE_LENGTH;
}

export type RecoveryErrorKind = 'bad-code' | 'rate-limited' | 'policy' | 'failed';

/** Sorts an Appwrite error from the recovery calls into something the screen can explain. */
export function classifyRecoveryError(error: { code?: number; type?: string }): RecoveryErrorKind {
  if (error.code === 429) return 'rate-limited';
  // A 404 means the account doesn't exist. It reads exactly like a wrong code on purpose, so the
  // screen can't be used to find out who has an account.
  if (error.code === 401 || error.code === 404 || error.type === 'user_invalid_token') {
    return 'bad-code';
  }
  if (error.code === 400) return 'policy';
  return 'failed';
}

/** An unknown address looks exactly like a known one, so the screen can't be used to find accounts. */
export function isUnknownAccountError(error: { code?: number }) {
  return error.code === 404;
}
