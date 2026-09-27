import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as itineraryApi from '../api/itinerary';
import * as tripsApi from '../api/trips';
import { CreateActivityInput, CreateTripInput, Trip, TripDetail, UpdateActivityInput } from '../types/api';

export const tripKeys = {
  all: ['trips'] as const,
  detail: (id: string) => ['trip', id] as const,
};

export function useTrips() {
  return useQuery({ queryKey: tripKeys.all, queryFn: tripsApi.listTrips });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: () => tripsApi.getTrip(id),
    enabled: id.length > 0,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTripInput) => tripsApi.createTrip(input),
    onSuccess: (trip: Trip) => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.all });
      queryClient.setQueryData(tripKeys.detail(trip.id), { ...trip, days: [] });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tripsApi.deleteTrip(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: tripKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

/** Slow (10-30s). Callers must render a real pending state, not a spinner over the whole screen. */
export function useGenerateItinerary(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => itineraryApi.generateItinerary(tripId),
    onSuccess: (trip: TripDetail) => {
      queryClient.setQueryData(tripKeys.detail(tripId), trip);
      void queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useRegenerateDay(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { dayNumber: number; feedback?: string }) =>
      itineraryApi.regenerateDay(tripId, input.dayNumber, input.feedback),
    onSuccess: (trip: TripDetail) => {
      queryClient.setQueryData(tripKeys.detail(tripId), trip);
    },
  });
}

export function useAddActivity(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { dayNumber: number; activity: CreateActivityInput }) =>
      itineraryApi.addActivity(tripId, input.dayNumber, input.activity),
    onSuccess: (trip: TripDetail) => {
      queryClient.setQueryData(tripKeys.detail(tripId), trip);
    },
  });
}

export function useUpdateActivity(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { activityId: string; activity: UpdateActivityInput }) =>
      itineraryApi.updateActivity(tripId, input.activityId, input.activity),
    onSuccess: (trip: TripDetail) => {
      queryClient.setQueryData(tripKeys.detail(tripId), trip);
    },
  });
}

export function useDeleteActivity(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => itineraryApi.deleteActivity(tripId, activityId),
    onSuccess: (trip: TripDetail) => {
      queryClient.setQueryData(tripKeys.detail(tripId), trip);
    },
  });
}
