import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import * as messagesApi from '../api/messages';
import { useAuth } from '../context/auth';
import { getSocket } from '../lib/socket';
import { Message } from '../types/api';

export const chatKeys = {
  thread: (peerId: string) => ['messages', peerId] as const,
  unread: ['messages-unread'] as const,
};

/** Unread counts for the Family tab badge and the per-member rows. */
export function useUnreadMessages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: chatKeys.unread,
    queryFn: messagesApi.getUnreadSummary,
    enabled: Boolean(user),
  });
}

/**
 * Keeps the unread counts live app-wide: any message addressed to me, or a read receipt from
 * another of my devices, refetches the summary. Mount once, somewhere that outlives the chat
 * screen (the tab layout).
 */
export function useUnreadSync(): void {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    function refresh(): void {
      void queryClient.invalidateQueries({ queryKey: chatKeys.unread });
    }
    function handleNew(message: Message): void {
      if (message.recipientId === user!.id) refresh();
    }

    socket.on('message:new', handleNew);
    socket.on('connect', refresh);
    return () => {
      socket.off('message:new', handleNew);
      socket.off('connect', refresh);
    };
  }, [user, queryClient]);
}

export function useChatThread(peerId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: chatKeys.thread(peerId),
    queryFn: () => messagesApi.listThread(peerId),
    enabled: peerId.length > 0,
  });

  // Live delivery: append/merge incoming messages for this thread, and mark the peer's
  // messages read as soon as the thread is open (and again whenever a new one arrives while
  // it's still open) — the socket connection itself is app-wide, owned by AuthProvider.
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    function concernsThisThread(message: Message): boolean {
      return (
        (message.senderId === peerId && message.recipientId === user!.id) ||
        (message.senderId === user!.id && message.recipientId === peerId)
      );
    }

    function markReadIfNeeded(): void {
      if (!socket) return;
      // The ack fires once the server has stored the read marks, so the badge refetch sees 0.
      socket.emit('message:read', { peerId }, () => {
        void queryClient.invalidateQueries({ queryKey: chatKeys.unread });
      });
    }

    function handleNew(message: Message): void {
      if (!concernsThisThread(message)) return;

      queryClient.setQueryData<Message[]>(chatKeys.thread(peerId), (current) => {
        const withoutDuplicate = (current ?? []).filter((existing) => existing.id !== message.id);
        return [...withoutDuplicate, message];
      });

      if (message.senderId === peerId) markReadIfNeeded();
    }

    function handleRead({ by }: { by: string }): void {
      if (by !== peerId) return;
      queryClient.setQueryData<Message[]>(chatKeys.thread(peerId), (current) =>
        current?.map((message) =>
          message.senderId === user!.id && !message.readAt
            ? { ...message, readAt: new Date().toISOString() }
            : message,
        ),
      );
    }

    socket.on('message:new', handleNew);
    socket.on('message:read', handleRead);
    markReadIfNeeded();

    return () => {
      socket.off('message:new', handleNew);
      socket.off('message:read', handleRead);
    };
  }, [peerId, user, queryClient]);

  return query;
}

type SendState = { isPending: boolean; error: string | null };

/** Sends over the socket rather than a TanStack mutation — there is no REST "send" route
 * (see `messages.controller.ts`), so this manages its own tiny pending/error state instead. */
export function useSendMessage(peerId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<SendState>({ isPending: false, error: null });
  const tempCounter = useRef(0);

  function send(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || !user) return;

    const socket = getSocket();
    if (!socket) {
      setState({ isPending: false, error: 'Not connected. Check your connection and retry.' });
      return;
    }

    tempCounter.current += 1;
    const tempId = `temp-${Date.now()}-${tempCounter.current}`;
    const optimistic: Message = {
      id: tempId,
      senderId: user.id,
      recipientId: peerId,
      text: trimmed,
      createdAt: new Date().toISOString(),
      readAt: null,
    };

    queryClient.setQueryData<Message[]>(chatKeys.thread(peerId), (current) => [
      ...(current ?? []),
      optimistic,
    ]);
    setState({ isPending: true, error: null });

    // A thrown WsException on the server (e.g. "not family") never invokes this ack at all —
    // Nest emits a separate `exception` event instead of acking — so a timeout is the only
    // way this side reliably learns the send failed, rather than sitting pending forever.
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      setState({ isPending: false, error: 'Could not send. Please try again.' });
    }, 8000);

    socket.emit(
      'message:send',
      { recipientId: peerId, text: trimmed },
      (response: Message | { message?: string }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        setState({ isPending: false, error: null });

        if (!response || !('id' in response)) {
          setState({ isPending: false, error: 'Could not send. Please try again.' });
          return;
        }

        // Swap the optimistic row for the real one. The `message:new` self-echo (see
        // `chat.gateway.ts`) can arrive before this ack and already append the real row,
        // so drop any existing copy of it first — otherwise both rows keep the same id and
        // FlatList's keyExtractor throws "two children with the same key".
        queryClient.setQueryData<Message[]>(chatKeys.thread(peerId), (current) => {
          if (!current) return current;
          const withoutEcho = current.filter((message) => message.id !== response.id);
          return withoutEcho.map((message) => (message.id === tempId ? response : message));
        });
      },
    );
  }

  return { send, ...state };
}
