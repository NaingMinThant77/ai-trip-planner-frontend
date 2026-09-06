import { Destination, Suggestion } from '../types/api';
import { api } from './client';

export async function listDestinations(params: {
  q?: string;
  region?: string;
}): Promise<Destination[]> {
  const { data } = await api.get<Destination[]>('/explore/destinations', { params });
  return data;
}

export async function getDestination(slug: string): Promise<Destination> {
  const { data } = await api.get<Destination>(`/explore/destinations/${slug}`);
  return data;
}

export async function listRegions(): Promise<string[]> {
  const { data } = await api.get<string[]>('/explore/regions');
  return data;
}

export async function listSuggestions(): Promise<Suggestion[]> {
  const { data } = await api.get<Suggestion[]>('/explore/suggestions');
  return data;
}
