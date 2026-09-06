import { AgentConversation, AgentMessage, AgentReply } from '../types/blocks';
import { api } from './client';

export async function listConversations(): Promise<AgentConversation[]> {
  const { data } = await api.get<AgentConversation[]>('/agent/conversations');
  return data;
}

export async function listMessages(conversationId: string): Promise<AgentMessage[]> {
  const { data } = await api.get<AgentMessage[]>(
    `/agent/conversations/${conversationId}/messages`,
  );
  return data;
}

export async function sendMessage(input: {
  message: string;
  conversationId?: string;
  tripId?: string;
}): Promise<AgentReply> {
  const { data } = await api.post<AgentReply>('/agent/messages', input);
  return data;
}
