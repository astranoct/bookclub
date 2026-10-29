import { DELETE_PHRASE, emailsMatch, validateDeleteConfirmation } from '../account';

describe('emailsMatch', () => {
  it('ignores case and surrounding spaces', () => {
    expect(emailsMatch(' Ada@Example.com ', 'ada@example.com')).toBe(true);
  });

  it('is false for different, empty, or missing emails', () => {
    expect(emailsMatch('ada@example.com', 'grace@example.com')).toBe(false);
    expect(emailsMatch('', '')).toBe(false);
    expect(emailsMatch(undefined, 'ada@example.com')).toBe(false);
  });
});

describe('validateDeleteConfirmation', () => {
  const blank = { email: '', password: '', phrase: '' };

  it('requires the account email and a password for email accounts', () => {
    expect(
      validateDeleteConfirmation('ada@example.com', { ...blank, email: 'ADA@example.com', password: 'secret' })
    ).toBeNull();
  });

  it('rejects the wrong email or a missing password', () => {
    expect(
      validateDeleteConfirmation('ada@example.com', { ...blank, email: 'other@example.com', password: 'x' })
    ).toMatch(/isn't the email/);
    expect(
      validateDeleteConfirmation('ada@example.com', { ...blank, email: 'ada@example.com' })
    ).toMatch(/password/);
  });

  it('asks guests to type the confirmation word instead', () => {
    expect(validateDeleteConfirmation(null, { ...blank, phrase: ` ${DELETE_PHRASE} ` })).toBeNull();
    expect(validateDeleteConfirmation(null, { ...blank, phrase: 'delete' })).toMatch(DELETE_PHRASE);
    expect(validateDeleteConfirmation('', blank)).toMatch(DELETE_PHRASE);
  });

  it("does not take a guest's typed email or password as confirmation", () => {
    expect(
      validateDeleteConfirmation(null, { email: 'ada@example.com', password: 'secret', phrase: '' })
    ).toMatch(DELETE_PHRASE);
  });
});
