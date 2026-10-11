/**
 * The booking form sends wall-clock strings (`2026-10-11 09:40`) and the server stores them as
 * UTC instants, so the `Z` on what comes back is bookkeeping, not a timezone the user chose.
 * Everything here reads the components as written, which keeps the card, the picker and the
 * form showing exactly what the user typed regardless of the device's timezone.
 */

export type WallClock = { year: number; month: number; day: number; hour: number; minute: number };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function parseWallClock(value: string | null | undefined): WallClock | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour = '0', minute = '0'] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
}

const toUtcMs = (c: WallClock): number => Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute);

/** `Sun, 11 Oct` */
export function formatDay(c: WallClock): string {
  const weekday = WEEKDAYS[new Date(toUtcMs(c)).getUTCDay()];
  return `${weekday}, ${c.day} ${MONTHS[c.month - 1]}`;
}

/** `9:40 AM` */
export function formatTime(c: WallClock): string {
  const suffix = c.hour >= 12 ? 'PM' : 'AM';
  const hour = c.hour % 12 === 0 ? 12 : c.hour % 12;
  return `${hour}:${String(c.minute).padStart(2, '0')} ${suffix}`;
}

/** `13h 5m`, or null when the range is missing or runs backwards. */
export function formatDuration(start: WallClock | null, end: WallClock | null): string | null {
  if (!start || !end) return null;
  const minutes = Math.round((toUtcMs(end) - toUtcMs(start)) / 60_000);
  if (minutes <= 0) return null;
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  return [days ? `${days}d` : '', hours ? `${hours}h` : '', mins ? `${mins}m` : '']
    .filter(Boolean)
    .join(' ');
}

export function nightsBetween(start: WallClock | null, end: WallClock | null): number | null {
  if (!start || !end) return null;
  const nights = Math.round(
    (Date.UTC(end.year, end.month - 1, end.day) - Date.UTC(start.year, start.month - 1, start.day)) /
      86_400_000,
  );
  return nights > 0 ? nights : null;
}

export type ParsedDetail = {
  headline: string | null;
  seat: string | null;
  room: string | null;
  confirmation: string | null;
  notes: string | null;
  other: string[];
};

/**
 * `detail` is one free-form string. The booking form composes it from labelled lines, so the
 * card can lift those back out into proper UI. Anything unrecognised (e.g. from a search
 * offer) is kept in `other` and shown as plain text.
 */
export function parseDetail(detail: string | null | undefined): ParsedDetail {
  const result: ParsedDetail = {
    headline: null,
    seat: null,
    room: null,
    confirmation: null,
    notes: null,
    other: [],
  };
  if (!detail) return result;

  const notesAt = detail.search(/(?:^|\n)Notes: /);
  let body = detail;
  if (notesAt !== -1) {
    result.notes = detail.slice(notesAt).replace(/^\n?Notes: /, '').trim() || null;
    body = detail.slice(0, notesAt);
  }

  for (const line of body.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const flight = /^Flight\s*(.*?)(?:\s*·\s*Seats?\s*(.+))?$/.exec(line);
    if (flight) {
      result.headline = flight[1] || null;
      result.seat = flight[2] ?? null;
    } else if (line.startsWith('Confirmation: ')) {
      result.confirmation = line.slice('Confirmation: '.length);
    } else if (line.startsWith('Room: ')) {
      result.room = line.slice('Room: '.length);
    } else {
      result.other.push(line);
    }
  }
  return result;
}

/** Adds a scheme when the user typed a bare `example.com`, so the link actually opens. */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function hostOf(raw: string): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(normalizeUrl(raw));
  return (match ? match[1] : raw).replace(/^www\./i, '');
}

export type ParsedLocation = { pickup: string | null; dropoff: string | null; plain: string | null };

/**
 * Car bookings fold both places into `location` as `Pickup: A · Drop-off: B`. Repeated
 * `Pickup:` prefixes are stripped because an earlier version of the edit form re-wrapped the
 * already-composed string each time it was saved.
 */
export function parseLocation(location: string | null | undefined): ParsedLocation {
  const empty: ParsedLocation = { pickup: null, dropoff: null, plain: null };
  if (!location) return empty;
  if (!/^\s*(Pickup|Drop-off):/i.test(location)) return { ...empty, plain: location };

  const dropMatch = /(?:^|\s·\s)Drop-off:\s*(.*)$/i.exec(location);
  const head = dropMatch ? location.slice(0, dropMatch.index) : location;
  const clean = (text: string, label: string): string | null =>
    text.replace(new RegExp(`^(?:\\s*${label}:\\s*)+`, 'i'), '').trim() || null;

  return {
    pickup: clean(head, 'Pickup'),
    dropoff: dropMatch ? clean(dropMatch[1], 'Drop-off') : null,
    plain: null,
  };
}
