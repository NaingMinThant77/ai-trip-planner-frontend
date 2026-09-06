import { UserProfile } from '../types/api';
import { api } from './client';

export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/profile');
  return data;
}

export async function updateProfile(input: {
  name?: string;
  email?: string;
  homeCity?: string;
  interests?: string[];
}): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>('/profile', input);
  return data;
}

/**
 * Same multipart shape as `uploadPhoto`: React Native's FormData takes a `{ uri, name, type }`
 * object rather than a Blob, and the Content-Type header is dropped so the platform sets the
 * multipart boundary itself.
 */
export async function uploadAvatar(input: {
  uri: string;
  fileName: string;
  mimeType: string;
}): Promise<UserProfile> {
  const form = new FormData();
  form.append('file', {
    uri: input.uri,
    name: input.fileName,
    type: input.mimeType,
  } as unknown as Blob);

  const { data } = await api.post<UserProfile>('/profile/avatar', form, {
    headers: { 'Content-Type': undefined },
    transformRequest: (value) => value,
  });

  return data;
}

export async function removeAvatar(): Promise<UserProfile> {
  const { data } = await api.delete<UserProfile>('/profile/avatar');
  return data;
}
