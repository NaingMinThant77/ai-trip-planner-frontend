import { TripDetail } from '../types/api';
import { api } from './client';

export async function generateItinerary(tripId: string): Promise<TripDetail> {
  const { data } = await api.post<TripDetail>(`/trips/${tripId}/itinerary`);
  return data;
}

export async function regenerateDay(
  tripId: string,
  dayNumber: number,
  feedback?: string,
): Promise<TripDetail> {
  const { data } = await api.post<TripDetail>(
    `/trips/${tripId}/itinerary/days/${dayNumber}/regenerate`,
    feedback ? { feedback } : {},
  );
  return data;
}
