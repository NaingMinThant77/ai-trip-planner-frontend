import { AuthResponse, User } from '../types/api';
import { API_BASE_URL, api } from './client';

export async function register(input: {
  email: string;
  name: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', input);
  return data;
}

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', input);
  return data;
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api.patch('/auth/password', input);
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me');
  return data;
}

/**
 * Not an axios call — this URL is handed to a system browser so the user can reach Google's
 * consent screen. The backend does the code exchange and redirects back to `redirectUri`
 * with either `token` or `error`.
 */
export function googleStartUrl(redirectUri: string): string {
  return `${API_BASE_URL}/auth/google/start?redirect=${encodeURIComponent(redirectUri)}`;
}
