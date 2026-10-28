import { displayName, initialOf, MAX_NAME_LENGTH, validateName } from '../people';

describe('displayName', () => {
  it('trims a real name', () => {
    expect(displayName('  Ada  ')).toBe('Ada');
  });

  it('falls back instead of exposing anything else', () => {
    expect(displayName('')).toBe('Unnamed reader');
    expect(displayName('   ')).toBe('Unnamed reader');
    expect(displayName(undefined)).toBe('Unnamed reader');
    expect(displayName(null)).toBe('Unnamed reader');
  });
});

describe('initialOf', () => {
  it('uppercases the first letter, or shows a placeholder', () => {
    expect(initialOf(' ada')).toBe('A');
    expect(initialOf('')).toBe('?');
  });
});

describe('validateName', () => {
  it('accepts a normal name', () => {
    expect(validateName('Ada Lovelace')).toBeNull();
  });

  it('rejects blank and overlong names', () => {
    expect(validateName('   ')).toBe('Enter a name.');
    expect(validateName('x'.repeat(MAX_NAME_LENGTH + 1))).toMatch(/under/);
  });
});
