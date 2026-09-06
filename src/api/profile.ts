import { UserProfile } from '../types/api';
import { api } from './client';

export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/profile');
  return data;
}

export async function updateProfile(input: {
  name?: string;
  homeCity?: string;
  interests?: string[];
}): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>('/profile', input);
  return data;
}
