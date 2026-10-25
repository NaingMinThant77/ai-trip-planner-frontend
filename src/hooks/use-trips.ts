import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as itineraryApi from '../api/itinerary';
import * as tripsApi from '../api/trips';
import {
  CreateActivityInput,
  CreateTripInput,
  Trip,
  TripDetail,
  UpdateActivityInput,
  UpdateTripInput,
} from '../types/api';

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

export function useUpdateTrip(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTripInput) => tripsApi.updateTrip(id, input),
    onSuccess: () => {
      // Dates can move the itinerary's days too, so the detail is refetched, not patched.
      void queryClient.invalidateQueries({ queryKey: tripKeys.all });
      void queryClient.invalidateQueries({ queryKey: tripKeys.detail(id) });
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
