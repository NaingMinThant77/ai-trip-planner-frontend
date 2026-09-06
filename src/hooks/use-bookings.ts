import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as bookingsApi from '../api/bookings';
import { BookingKind, BookingOffer } from '../types/api';

export const bookingKeys = {
  saved: (tripId: string) => ['bookings', tripId] as const,
  search: (tripId: string, kind: BookingKind) => ['bookings', tripId, 'search', kind] as const,
};

/** Search results are indicative; see memory/01-product.md. Cached briefly, never persisted. */
export function useBookingSearch(tripId: string, kind: BookingKind, enabled: boolean) {
  return useQuery({
    queryKey: bookingKeys.search(tripId, kind),
    queryFn: () => bookingsApi.searchBookings(tripId, kind),
    enabled: enabled && tripId.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSavedBookings(tripId: string) {
  return useQuery({
    queryKey: bookingKeys.saved(tripId),
    queryFn: () => bookingsApi.listSavedBookings(tripId),
    enabled: tripId.length > 0,
  });
}

export function useSaveBooking(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offer: BookingOffer) => bookingsApi.saveBooking(tripId, offer),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.saved(tripId) });
    },
  });
}

export function useDeleteBooking(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => bookingsApi.deleteBooking(tripId, bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.saved(tripId) });
    },
  });
}
