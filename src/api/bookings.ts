import { BookingKind, BookingOffer, SavedBooking } from '../types/api';
import { api } from './client';

/** Informational search only. Nothing is held or reserved. */
export async function searchBookings(
  tripId: string,
  kind: BookingKind,
): Promise<BookingOffer[]> {
  const { data } = await api.get<BookingOffer[]>(`/trips/${tripId}/bookings/search`, {
    params: { kind },
  });
  return data;
}

export async function listSavedBookings(tripId: string): Promise<SavedBooking[]> {
  const { data } = await api.get<SavedBooking[]>(`/trips/${tripId}/bookings`);
  return data;
}

export async function saveBooking(
  tripId: string,
  offer: BookingOffer,
): Promise<SavedBooking> {
  const { data } = await api.post<SavedBooking>(`/trips/${tripId}/bookings`, {
    kind: offer.kind,
    title: offer.title,
    provider: offer.provider,
    priceText: offer.priceText ?? undefined,
    location: offer.location ?? undefined,
    startsAt: offer.startsAt ?? undefined,
    endsAt: offer.endsAt ?? undefined,
    detail: offer.detail || undefined,
    externalUrl: offer.externalUrl ?? undefined,
  });
  return data;
}

export async function deleteBooking(tripId: string, bookingId: string): Promise<void> {
  await api.delete(`/trips/${tripId}/bookings/${bookingId}`);
}
