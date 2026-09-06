import { Photo } from '../types/api';
import { api } from './client';

export async function listPhotos(tripId: string): Promise<Photo[]> {
  const { data } = await api.get<Photo[]>(`/trips/${tripId}/photos`);
  return data;
}

/**
 * React Native's FormData takes a `{ uri, name, type }` object rather than a Blob.
 * The Content-Type header is deleted so axios lets the platform set the multipart boundary.
 */
export async function uploadPhoto(
  tripId: string,
  input: { uri: string; fileName: string; mimeType: string; caption?: string },
): Promise<Photo> {
  const form = new FormData();
  form.append('file', {
    uri: input.uri,
    name: input.fileName,
    type: input.mimeType,
  } as unknown as Blob);

  if (input.caption) form.append('caption', input.caption);

  const { data } = await api.post<Photo>(`/trips/${tripId}/photos`, form, {
    headers: { 'Content-Type': undefined },
    transformRequest: (value) => value,
  });

  return data;
}

export async function deletePhoto(tripId: string, photoId: string): Promise<void> {
  await api.delete(`/trips/${tripId}/photos/${photoId}`);
}
