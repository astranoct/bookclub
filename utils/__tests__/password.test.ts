import {
  classifyRecoveryError,
  isCompleteRecoveryCode,
  isUnknownAccountError,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  normalizeRecoveryCode,
  validateNewPassword,
} from '../password';

describe('validateNewPassword', () => {
  it('accepts a matching password of a sensible length', () => {
    expect(validateNewPassword('correct horse', 'correct horse')).toBeNull();
  });

  it('rejects one that is too short, even if it matches', () => {
    expect(validateNewPassword('short', 'short')).toMatch(String(MIN_PASSWORD_LENGTH));
  });

  it('rejects one that is too long', () => {
    const long = 'x'.repeat(MAX_PASSWORD_LENGTH + 1);
    expect(validateNewPassword(long, long)).toMatch(/under/);
  });

  it("rejects a confirmation that doesn't match", () => {
    expect(validateNewPassword('correct horse', 'correct horsf')).toMatch(/match/);
  });

  it('does not trim spaces, since they can be part of a password', () => {
    expect(validateNewPassword('  spaced out  ', '  spaced out  ')).toBeNull();
    expect(validateNewPassword('  spaced out  ', 'spaced out')).toMatch(/match/);
  });
});

describe('normalizeRecoveryCode', () => {
  it('keeps only digits', () => {
    expect(normalizeRecoveryCode('123 456')).toBe('123456');
    expect(normalizeRecoveryCode('12-34-56')).toBe('123456');
    expect(normalizeRecoveryCode(' abc ')).toBe('');
  });

  it('cuts off anything past six digits', () => {
    expect(normalizeRecoveryCode('1234567890')).toBe('123456');
  });
});

describe('isCompleteRecoveryCode', () => {
  it('is true only for exactly six digits', () => {
    expect(isCompleteRecoveryCode('123456')).toBe(true);
    expect(isCompleteRecoveryCode('123 456')).toBe(true);
    expect(isCompleteRecoveryCode('12345')).toBe(false);
    expect(isCompleteRecoveryCode('')).toBe(false);
  });
});

describe('classifyRecoveryError', () => {
  it('recognises a wrong or expired code', () => {
    expect(classifyRecoveryError({ code: 401 })).toBe('bad-code');
    expect(classifyRecoveryError({ code: 400, type: 'user_invalid_token' })).toBe('bad-code');
  });

  it('treats an unknown account like a wrong code, so accounts cannot be discovered', () => {
    expect(classifyRecoveryError({ code: 404, type: 'user_not_found' })).toBe('bad-code');
  });

  it('recognises rate limiting and password rule failures', () => {
    expect(classifyRecoveryError({ code: 429 })).toBe('rate-limited');
    expect(classifyRecoveryError({ code: 400, type: 'password_recently_used' })).toBe('policy');
  });

  it('falls back to a general failure', () => {
    expect(classifyRecoveryError({ code: 500 })).toBe('failed');
    expect(classifyRecoveryError({})).toBe('failed');
  });
});

describe('isUnknownAccountError', () => {
  it('is true only for not-found errors', () => {
    expect(isUnknownAccountError({ code: 404 })).toBe(true);
    expect(isUnknownAccountError({ code: 401 })).toBe(false);
  });
});
