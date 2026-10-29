import { isValidEmail } from '@/utils/invites';

export const MIN_SUPPORT_LENGTH = 10;
export const MAX_SUPPORT_LENGTH = 2000;
/** Stops someone sending the same message over and over by accident. */
export const SUPPORT_COOLDOWN_MS = 30_000;

/** Returns an error message for a message that can't be sent, or null if it is fine. */
export function validateSupportMessage(message: string) {
  const length = message.trim().length;
  if (length < MIN_SUPPORT_LENGTH) return 'Tell us a little more so we can help.';
  if (length > MAX_SUPPORT_LENGTH) return `Keep it under ${MAX_SUPPORT_LENGTH} characters.`;
  return null;
}

/** The reply address is optional, so an empty value is fine. */
export function validateReplyEmail(email: string) {
  const trimmed = email.trim();
  if (!trimmed) return null;
  return isValidEmail(trimmed) ? null : 'That email address looks wrong.';
}

export interface SupportPayload {
  message: string;
  replyEmail?: string;
  appVersion: string;
  platform: string;
}

/** What gets sent to support. It deliberately carries no account details beyond what's typed. */
export function buildSupportPayload(input: {
  message: string;
  replyEmail: string;
  appVersion: string;
  platform: string;
}): SupportPayload {
  const replyEmail = input.replyEmail.trim().toLowerCase();
  return {
    message: input.message.trim(),
    ...(replyEmail ? { replyEmail } : {}),
    appVersion: input.appVersion,
    platform: input.platform,
  };
}

/** Milliseconds left before another message may be sent (0 when it may be sent now). */
export function cooldownRemaining(lastSentAt: number | null, now: number) {
  if (lastSentAt === null) return 0;
  return Math.max(0, SUPPORT_COOLDOWN_MS - (now - lastSentAt));
}
