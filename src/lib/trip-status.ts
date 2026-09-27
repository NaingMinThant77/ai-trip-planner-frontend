import { Trip, TripListItem } from '../types/api';

export type TripPhase = 'upcoming' | 'ongoing' | 'completed';

export const TRIP_PHASE_LABEL: Record<TripPhase, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
};

/**
 * Where a trip sits relative to today. Compared at day granularity, so a trip that ends
 * today still reads as "Ongoing" rather than flipping to "Completed" at midnight UTC.
 */
export function tripPhase(trip: Pick<Trip, 'startDate' | 'endDate'>, now = new Date()): TripPhase {
  const today = startOfDay(now).getTime();
  const start = startOfDay(new Date(trip.startDate)).getTime();
  const end = startOfDay(new Date(trip.endDate)).getTime();

  if (today < start) return 'upcoming';
  if (today > end) return 'completed';
  return 'ongoing';
}

/** Inclusive of both ends: 2 Aug – 5 Aug is a 4-day trip, which is how the cards read. */
export function tripDayCount(trip: Pick<Trip, 'startDate' | 'endDate'>): number {
  const start = startOfDay(new Date(trip.startDate)).getTime();
  const end = startOfDay(new Date(trip.endDate)).getTime();
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

export function formatTripRange(trip: Pick<Trip, 'startDate' | 'endDate'>): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const from = new Date(trip.startDate).toLocaleDateString(undefined, options);
  const to = new Date(trip.endDate).toLocaleDateString(undefined, {
    ...options,
    year: 'numeric',
  });
  return `${from} – ${to}`;
}

/**
 * The single trip most worth nudging: the one that has started or is closest to starting and
 * is still incomplete. Returns null when everything upcoming is fully planned.
 */
export function tripNeedingAttention(trips: TripListItem[], now = new Date()): TripListItem | null {
  const candidates = trips
    .filter((trip) => tripPhase(trip, now) !== 'completed' && trip.planning.progress < 100)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return candidates[0] ?? null;
}

/** What to do next on a trip, phrased for a nudge card. Null when nothing is left. */
export function nextPlanningStep(trip: TripListItem): string | null {
  if (!trip.planning.hasItinerary) return 'Start with a day-by-day itinerary to get moving.';
  if (!trip.planning.hasPacking) return 'Add a packing list so nothing gets left behind.';
  if (!trip.planning.hasBookings) return 'Save your flights, hotel or car in Bookings.';
  return null;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
