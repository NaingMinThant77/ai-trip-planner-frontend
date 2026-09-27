import { CreateTripInput, Trip, TripDetail, TripListItem } from '../types/api';
import { api } from './client';

export async function listTrips(): Promise<TripListItem[]> {
  const { data } = await api.get<TripListItem[]>('/trips');
  return data;
}

export async function getTrip(id: string): Promise<TripDetail> {
  const { data } = await api.get<TripDetail>(`/trips/${id}`);
  return data;
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const { data } = await api.post<Trip>('/trips', input);
  return data;
}

export async function deleteTrip(id: string): Promise<void> {
  await api.delete(`/trips/${id}`);
}
