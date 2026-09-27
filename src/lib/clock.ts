import { TimeOfDay } from '../types/api';

/**
 * Stop times travel as 24-hour "HH:mm" strings (see 03-api-contract.md) and are shown as
 * 12-hour with AM/PM. Dates are only used as a carrier for the native time picker.
 */

export function toClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromClock(clock: string): Date {
  const [hours, minutes] = clock.split(':').map(Number);
  const date = new Date();
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return date;
}

export function minutesOfDay(clock: string): number {
  const [hours, minutes] = clock.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function formatClock(clock: string): string {
  const [hours = 0, minutes = 0] = clock.split(':').map(Number);
  const suffix = hours < 12 ? 'AM' : 'PM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${pad(minutes)} ${suffix}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** Where a generated stop (time of day only) lands when it is first edited with real times. */
export const TIME_OF_DAY_START: Record<TimeOfDay, string> = {
  morning: '09:00',
  afternoon: '13:00',
  evening: '18:00',
};

export function addMinutes(clock: string, minutes: number): string {
  const total = Math.min(minutesOfDay(clock) + minutes, 23 * 60 + 59);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
