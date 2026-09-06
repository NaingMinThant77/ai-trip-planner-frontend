import { Collaborator, ShareState } from '../types/api';
import { api } from './client';

export async function getShareState(tripId: string): Promise<ShareState> {
  const { data } = await api.get<ShareState>(`/trips/${tripId}/share`);
  return data;
}

export async function enableShare(tripId: string): Promise<ShareState> {
  const { data } = await api.post<ShareState>(`/trips/${tripId}/share`);
  return data;
}

export async function disableShare(tripId: string): Promise<ShareState> {
  const { data } = await api.delete<ShareState>(`/trips/${tripId}/share`);
  return data;
}

export async function listCollaborators(tripId: string): Promise<Collaborator[]> {
  const { data } = await api.get<Collaborator[]>(`/trips/${tripId}/share/collaborators`);
  return data;
}

export async function addCollaborator(
  tripId: string,
  input: { email: string; name?: string },
): Promise<Collaborator> {
  const { data } = await api.post<Collaborator>(`/trips/${tripId}/share/collaborators`, input);
  return data;
}

export async function removeCollaborator(tripId: string, collaboratorId: string): Promise<void> {
  await api.delete(`/trips/${tripId}/share/collaborators/${collaboratorId}`);
}
