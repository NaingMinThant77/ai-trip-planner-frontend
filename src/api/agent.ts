import { AgentConversation, AgentMessage, SaveableBlock, SaveResult } from '../types/blocks';
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

export async function saveBlock(input: {
  tripId?: string;
  conversationId?: string;
  block: SaveableBlock;
}): Promise<SaveResult> {
  const { data } = await api.post<SaveResult>('/agent/save', input);
  return data;
}
