import {
  buildSupportPayload,
  cooldownRemaining,
  MAX_SUPPORT_LENGTH,
  SUPPORT_COOLDOWN_MS,
  validateReplyEmail,
  validateSupportMessage,
} from '../support';

describe('validateSupportMessage', () => {
  it('accepts a normal message', () => {
    expect(validateSupportMessage('The search screen crashes when I tap back.')).toBeNull();
  });

  it('rejects messages that are too short or too long', () => {
    expect(validateSupportMessage('   hi   ')).toMatch(/more/);
    expect(validateSupportMessage('x'.repeat(MAX_SUPPORT_LENGTH + 1))).toMatch(/under/);
  });
});

describe('validateReplyEmail', () => {
  it('treats an empty value as fine, since it is optional', () => {
    expect(validateReplyEmail('')).toBeNull();
    expect(validateReplyEmail('   ')).toBeNull();
  });

  it('accepts a real address and rejects a malformed one', () => {
    expect(validateReplyEmail('ada@example.com')).toBeNull();
    expect(validateReplyEmail('not an email')).toMatch(/wrong/);
  });
});

describe('buildSupportPayload', () => {
  const base = { message: '  It broke  ', replyEmail: '', appVersion: '1.0.0', platform: 'android' };

  it('trims the message and leaves out an empty reply address', () => {
    expect(buildSupportPayload(base)).toEqual({
      message: 'It broke',
      appVersion: '1.0.0',
      platform: 'android',
    });
  });

  it('includes a normalised reply address when one is given', () => {
    expect(buildSupportPayload({ ...base, replyEmail: ' Ada@Example.com ' }).replyEmail).toBe(
      'ada@example.com'
    );
  });

  it('carries nothing that identifies the account', () => {
    expect(Object.keys(buildSupportPayload(base)).sort()).toEqual(['appVersion', 'message', 'platform']);
  });
});

describe('cooldownRemaining', () => {
  it('is zero before anything has been sent', () => {
    expect(cooldownRemaining(null, 1000)).toBe(0);
  });

  it('counts down and then reaches zero', () => {
    expect(cooldownRemaining(0, 10_000)).toBe(SUPPORT_COOLDOWN_MS - 10_000);
    expect(cooldownRemaining(0, SUPPORT_COOLDOWN_MS + 1)).toBe(0);
  });
});
