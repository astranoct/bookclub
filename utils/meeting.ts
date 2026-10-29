import type { Meeting } from '@/types/club';

export const MAX_MEETING_NOTE = 140;

export function isUpcoming(meeting: Meeting | null | undefined, now = new Date()) {
  if (!meeting) return false;
  const at = new Date(meeting.at).getTime();
  return !Number.isNaN(at) && at >= now.getTime();
}

interface FormatOptions {
  locale?: string;
  timeZone?: string;
}

/** For example "Fri, Nov 6, 7:00 PM", in the viewer's own time zone unless told otherwise. */
export function formatMeeting(at: string, { locale, timeZone }: FormatOptions = {}) {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  });
}

/** The date from one value and the clock time from another, in local time. */
export function combineDateAndTime(date: Date, time: Date) {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined;
}

/** Parses "YYYY-MM-DD HH:mm" in local time, the format used where no native picker exists. */
export function parseLocalDateTime(text: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  const date = new Date(y, mo - 1, d, h, mi, 0, 0);
  const valid =
    date.getFullYear() === y &&
    date.getMonth() === mo - 1 &&
    date.getDate() === d &&
    date.getHours() === h &&
    date.getMinutes() === mi;
  return valid ? date : null;
}

/** Returns an error message if the meeting can't be saved, or null if it is fine. */
export function validateMeeting(date: Date | null, note: string, now = new Date()) {
  if (!date || Number.isNaN(date.getTime())) return 'Pick a date and time.';
  if (date.getTime() < now.getTime()) return 'Pick a time in the future.';
  if (note.trim().length > MAX_MEETING_NOTE) {
    return `Keep the note under ${MAX_MEETING_NOTE} characters.`;
  }
  return null;
}
