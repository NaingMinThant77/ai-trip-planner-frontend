import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as agentApi from '../api/agent';
import { AgentMessage } from '../types/blocks';

export const agentKeys = {
  conversations: ['agent', 'conversations'] as const,
  messages: (conversationId: string) => ['agent', 'messages', conversationId] as const,
};

export function useConversations() {
  return useQuery({ queryKey: agentKeys.conversations, queryFn: agentApi.listConversations });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: agentKeys.messages(conversationId ?? ''),
    queryFn: () => agentApi.listMessages(conversationId ?? ''),
    enabled: Boolean(conversationId),
  });
}

/**
 * Appends the user's turn to the cache immediately — the model reply takes seconds, and the
 * message disappearing from the thread in the meantime feels broken.
 */
export function useSendMessage(conversationId: string | null, tripId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: string) =>
      agentApi.sendMessage({
        message,
        conversationId: conversationId ?? undefined,
        tripId,
      }),

    onMutate: (message) => {
      if (!conversationId) return;

      const key = agentKeys.messages(conversationId);
      const optimistic: AgentMessage = {
        id: `pending-${Date.now()}`,
        role: 'user',
        text: message,
        blocks: [],
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<AgentMessage[]>(key, (messages) => [
        ...(messages ?? []),
        optimistic,
      ]);
    },

    onSuccess: (reply) => {
      // Refetch rather than splice: the server also persisted the user turn, and the
      // optimistic copy has a placeholder id.
      void queryClient.invalidateQueries({ queryKey: agentKeys.messages(reply.conversationId) });
      void queryClient.invalidateQueries({ queryKey: agentKeys.conversations });
    },

    onError: () => {
      if (conversationId) {
        void queryClient.invalidateQueries({ queryKey: agentKeys.messages(conversationId) });
      }
    },
  });
}
