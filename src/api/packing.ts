import { PackingCategory, PackingItem } from '../types/api';
import { api } from './client';

export async function listPacking(tripId: string): Promise<PackingItem[]> {
  const { data } = await api.get<PackingItem[]>(`/trips/${tripId}/packing`);
  return data;
}

export async function createPackingItem(
  tripId: string,
  input: { label: string; category?: PackingCategory; quantity?: number },
): Promise<PackingItem> {
  const { data } = await api.post<PackingItem>(`/trips/${tripId}/packing`, input);
  return data;
}

export async function updatePackingItem(
  tripId: string,
  itemId: string,
  input: { label?: string; category?: PackingCategory; quantity?: number; isPacked?: boolean },
): Promise<PackingItem> {
  const { data } = await api.patch<PackingItem>(`/trips/${tripId}/packing/${itemId}`, input);
  return data;
}

export async function deletePackingItem(tripId: string, itemId: string): Promise<void> {
  await api.delete(`/trips/${tripId}/packing/${itemId}`);
}
