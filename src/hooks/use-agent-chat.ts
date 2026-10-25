import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { streamAgentMessage } from '../api/agent-stream';
import { ApiError } from '../api/client';
import { AgentMessage, AgentStreamEvent, UiBlock } from '../types/blocks';
import { agentKeys, useMessages } from './use-agent';

/** The reply being written right now: finished blocks plus the text block still open. */
export type LiveReply = { blocks: UiBlock[]; draft: string };

/**
 * One chat session against the streaming agent. Owns the thread, the in-flight reply and the
 * abort handle. Remount (change `key`) to start a different conversation.
 *
 * `tripId` may change mid-session — creating a trip from a chat card makes it the subject of
 * the same thread — so it is read at send time rather than captured once.
 */
export function useAgentChat(options: { tripId: string | null; resumeConversationId: string | null }) {
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(options.resumeConversationId);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [live, setLive] = useState<LiveReply | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const tripIdRef = useRef(options.tripId);
  const hasLoadedHistory = useRef(false);
  tripIdRef.current = options.tripId;

  // Resuming a trip's last conversation: seed the thread once, never overwrite a live one.
  const history = useMessages(options.resumeConversationId);
  useEffect(() => {
    if (hasLoadedHistory.current || !history.data) return;
    hasLoadedHistory.current = true;
    setMessages((current) => (current.length === 0 ? history.data : current));
  }, [history.data]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();
      if (!trimmed || abortRef.current) return;

      const controller = new AbortController();
      abortRef.current = controller;
      setError(null);
      setLive({ blocks: [], draft: '' });
      setMessages((current) => [
        ...current,
        {
          id: `local-${Date.now()}`,
          role: 'user',
          text: trimmed,
          blocks: [],
          createdAt: new Date().toISOString(),
        },
      ]);

      let blocks: UiBlock[] = [];
      let finished = false;

      function onEvent(event: AgentStreamEvent): void {
        switch (event.event) {
          case 'meta':
            setConversationId(event.data.conversationId);
            break;
          case 'text_delta':
            setLive((current) => (current ? { ...current, draft: current.draft + event.data.delta } : current));
            break;
          case 'block':
            blocks = [...blocks, event.data.block];
            // The finished block replaces the draft that was typing it out.
            setLive({ blocks, draft: '' });
            break;
          case 'done':
            finished = true;
            setMessages((current) => [...current, event.data.message]);
            setLive(null);
            break;
          case 'error':
            setError(event.data.message);
            break;
        }
      }

      try {
        await streamAgentMessage(
          {
            message: trimmed,
            conversationId: conversationId ?? undefined,
            tripId: tripIdRef.current ?? undefined,
          },
          onEvent,
          controller.signal,
        );
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : 'The assistant did not reply.');
      } finally {
        abortRef.current = null;
        // A stopped or failed reply keeps whatever blocks already arrived — the server saved them.
        if (!finished && blocks.length > 0) {
          setMessages((current) => [
            ...current,
            {
              id: `partial-${Date.now()}`,
              role: 'assistant',
              text: '',
              blocks,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        setLive(null);
        void queryClient.invalidateQueries({ queryKey: agentKeys.conversations });
      }
    },
    [conversationId, queryClient],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return {
    messages,
    live,
    error,
    conversationId,
    isStreaming: live !== null,
    isLoadingHistory: Boolean(options.resumeConversationId) && history.isPending,
    send,
    stop,
  };
}
