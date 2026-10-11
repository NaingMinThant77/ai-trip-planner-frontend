import { Message, UnreadSummary } from '../types/api';
import { api } from './client';

/** History only — sending goes over the chat socket (`lib/socket.ts`) so it delivers live. */
export async function listThread(peerId: string, before?: string): Promise<Message[]> {
  const { data } = await api.get<Message[]>(`/messages/${peerId}`, {
    params: before ? { before } : undefined,
  });
  return data;
}

export async function getUnreadSummary(): Promise<UnreadSummary> {
  const { data } = await api.get<UnreadSummary>('/messages/unread/summary');
  return data;
}
