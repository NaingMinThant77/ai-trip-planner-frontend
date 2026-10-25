import { CreateActivityInput, TripDetail, UpdateActivityInput } from '../types/api';
import { api } from './client';

export async function addActivity(
  tripId: string,
  dayNumber: number,
  input: CreateActivityInput,
): Promise<TripDetail> {
  const { data } = await api.post<TripDetail>(
    `/trips/${tripId}/itinerary/days/${dayNumber}/activities`,
    input,
  );
  return data;
}

export async function updateActivity(
  tripId: string,
  activityId: string,
  input: UpdateActivityInput,
): Promise<TripDetail> {
  const { data } = await api.patch<TripDetail>(
    `/trips/${tripId}/itinerary/activities/${activityId}`,
    input,
  );
  return data;
}

export async function deleteActivity(tripId: string, activityId: string): Promise<TripDetail> {
  const { data } = await api.delete<TripDetail>(
    `/trips/${tripId}/itinerary/activities/${activityId}`,
  );
  return data;
}
