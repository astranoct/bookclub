import {
  combineDateAndTime,
  formatMeeting,
  isUpcoming,
  MAX_MEETING_NOTE,
  parseLocalDateTime,
  validateMeeting,
} from '../meeting';

const now = new Date('2026-11-01T12:00:00Z');

describe('isUpcoming', () => {
  it('is true only for future meetings', () => {
    expect(isUpcoming({ at: '2026-11-06T19:00:00Z' }, now)).toBe(true);
    expect(isUpcoming({ at: '2026-10-30T19:00:00Z' }, now)).toBe(false);
    expect(isUpcoming(null, now)).toBe(false);
    expect(isUpcoming({ at: 'not a date' }, now)).toBe(false);
  });
});

describe('formatMeeting', () => {
  it('formats in the requested time zone', () => {
    expect(formatMeeting('2026-11-06T19:00:00Z', { locale: 'en-US', timeZone: 'UTC' })).toBe(
      'Fri, Nov 6, 7:00 PM'
    );
  });

  it('returns an empty string for a bad date', () => {
    expect(formatMeeting('nope')).toBe('');
  });
});

describe('combineDateAndTime', () => {
  it('takes the day from one value and the clock time from the other', () => {
    const result = combineDateAndTime(new Date(2026, 10, 6, 0, 0), new Date(2000, 0, 1, 19, 30));
    expect([result.getFullYear(), result.getMonth(), result.getDate()]).toEqual([2026, 10, 6]);
    expect([result.getHours(), result.getMinutes()]).toEqual([19, 30]);
  });
});

describe('parseLocalDateTime', () => {
  it('parses a valid value', () => {
    const date = parseLocalDateTime('2026-11-06 19:30');
    expect(date && [date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]).toEqual([
      10, 6, 19, 30,
    ]);
  });

  it('rejects bad formats and impossible dates', () => {
    expect(parseLocalDateTime('tomorrow')).toBeNull();
    expect(parseLocalDateTime('2026-02-30 10:00')).toBeNull();
    expect(parseLocalDateTime('2026-11-06 25:00')).toBeNull();
  });
});

describe('validateMeeting', () => {
  const future = new Date('2026-11-06T19:00:00Z');

  it('accepts a future time with a short note', () => {
    expect(validateMeeting(future, 'The cafe', now)).toBeNull();
  });

  it('rejects missing, past, and over-long input', () => {
    expect(validateMeeting(null, '', now)).toMatch(/date and time/);
    expect(validateMeeting(new Date('2026-10-01T00:00:00Z'), '', now)).toMatch(/future/);
    expect(validateMeeting(future, 'x'.repeat(MAX_MEETING_NOTE + 1), now)).toMatch(/under/);
  });
});
