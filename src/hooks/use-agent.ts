import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as agentApi from '../api/agent';
import { TripListItem } from '../types/api';
import { SaveableBlock } from '../types/blocks';
import { tripKeys } from './use-trips';

/** Every 8s for ~2 minutes: the free image generator is slow and sometimes retries internally. */
const COVER_POLL_MS = 8_000;
const COVER_POLL_LIMIT = 15;

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
 * "Save to trip". A saved card can change a trip, its days, packing or bookings, so every
 * non-agent query is refreshed rather than guessing which screens are showing stale data.
 */
export function useSaveBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { tripId?: string; conversationId?: string; block: SaveableBlock }) => agentApi.saveBlock(input),
    onSuccess: (result) => {
      const refresh = () =>
        void queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] !== 'agent',
        });
      refresh();
      // The chat is now attached to the trip; the conversation list has to know.
      if (result.kind === 'trip_summary') {
        void queryClient.invalidateQueries({ queryKey: agentKeys.conversations });
      }

      // A new trip's cover is generated in the background and can take a minute or more, so keep
      // checking until it lands (or we give up) rather than relying on a fixed couple of tries.
      if (result.kind === 'trip_summary') {
        let checks = 0;
        const timer = setInterval(() => {
          checks += 1;
          const trips = queryClient.getQueryData<TripListItem[]>(tripKeys.all);
          const hasCover = trips?.find((t) => t.id === result.tripId)?.coverImageUrl;
          if (hasCover || checks > COVER_POLL_LIMIT) {
            clearInterval(timer);
            return;
          }
          refresh();
        }, COVER_POLL_MS);
      }
    },
  });
}
