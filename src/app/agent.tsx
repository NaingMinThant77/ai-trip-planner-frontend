import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../api/client';
import { TripSelector } from '../components/agent/trip-selector';
import { TypingDots } from '../components/agent/typing-dots';
import { BlockRenderer } from '../components/blocks/block-renderer';
import { SuggestionsBlockView } from '../components/blocks/suggestions-block';
import { TextBlockView } from '../components/blocks/text-block';
import { KeyboardSafeView } from '../components/ui/keyboard-safe-view';
import { ErrorState, LoadingState } from '../components/ui/screen-state';
import { useConversations, useSaveBlock } from '../hooks/use-agent';
import { LiveReply, useAgentChat } from '../hooks/use-agent-chat';
import { useTrips } from '../hooks/use-trips';
import { tripPhase } from '../lib/trip-status';
import { colors, fontSize, gradients, radii, spacing } from '../theme';
import { AgentConversation, AgentMessage, SaveableBlock, SaveResult } from '../types/blocks';

const NEW_TRIP_STARTERS = [
  'Plan a 5 day trip',
  'Weekend getaway on a budget',
  'Family trip with kids',
  'Somewhere warm in March',
];

const TRIP_STARTERS = [
  "What's planned for my first day?",
  'Suggest restaurants nearby',
  'What should I pack?',
  'Add a day trip idea',
];

/** What this screen is currently chatting about. `key` changes force a fresh thread. */
type Session = { key: number; tripId: string | null; resumeId: string | null };

export default function AgentScreen() {
  const params = useLocalSearchParams<{ tripId?: string }>();
  const trips = useTrips();
  const conversations = useConversations();

  // The thread to resume depends on the conversation list, so wait for it rather than flashing
  // an empty chat and then swapping it.
  if (trips.isPending || conversations.isPending) {
    return <LoadingState label="Getting your assistant ready…" />;
  }
  if (trips.isError) {
    return (
      <ErrorState
        message={trips.error instanceof ApiError ? trips.error.message : 'Could not load your trips.'}
        onRetry={() => void trips.refetch()}
      />
    );
  }

  const initialTripId = trips.data.some((trip) => trip.id === params.tripId)
    ? (params.tripId ?? null)
    : null;

  return <AgentChat initialTripId={initialTripId} initialConversations={conversations.data ?? []} />;
}

function AgentChat({
  initialTripId,
  initialConversations,
}: {
  initialTripId: string | null;
  initialConversations: AgentConversation[];
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useTrips();
  // Live, not the snapshot from mount: saving a trip attaches its chat while this screen is open.
  const conversations = useConversations().data ?? initialConversations;
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<Session>(() => ({
    key: 0,
    tripId: initialTripId,
    resumeId: latestConversationFor(conversations, initialTripId),
  }));

  // Conversations are newest-first, so the first match is the last thing said about the trip.
  function selectTrip(tripId: string | null): void {
    setMenuOpen(false);
    if (tripId === session.tripId) return;
    setSession((current) => ({
      key: current.key + 1,
      tripId,
      resumeId: latestConversationFor(conversations, tripId),
    }));
  }

  function confirmNewChat(): void {
    Alert.alert('Start a new chat?', 'Your current conversation stays saved with the trip.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'New chat',
        onPress: () => setSession((current) => ({ ...current, key: current.key + 1, resumeId: null })),
      },
    ]);
  }

  // Active and upcoming only — plus the selected trip even if it has finished (deep link).
  const selectable = useMemo(
    () =>
      (trips.data ?? [])
        .filter((trip) => tripPhase(trip) !== 'completed' || trip.id === session.tripId)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [trips.data, session.tripId],
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <LinearGradient colors={gradients.brand} style={styles.avatar}>
          <Ionicons name="sparkles" size={20} color={colors.textInverse} />
        </LinearGradient>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>AI Agent / Trip Assistant</Text>
          <Text style={styles.headerSub}>Always here to plan with you ✨</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chat options"
          hitSlop={8}
          onPress={confirmNewChat}
          style={styles.headerButton}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
        </Pressable>
      </View>

      <TripSelector
        trips={selectable}
        selectedId={session.tripId}
        isOpen={menuOpen}
        onToggle={() => setMenuOpen((open) => !open)}
        onSelect={selectTrip}
        onOpenTrip={(id) => router.push(`/trip/${id}`)}
      />

      <ChatSession
        key={session.key}
        tripId={session.tripId}
        resumeId={session.resumeId}
        bottomInset={insets.bottom}
        onTripCreated={(tripId) => setSession((current) => ({ ...current, tripId }))}
        onOpenTrip={(id) => router.push(`/trip/${id}`)}
      />
    </View>
  );
}

function latestConversationFor(conversations: AgentConversation[], tripId: string | null): string | null {
  if (!tripId) return null;
  return conversations.find((c) => c.tripId === tripId)?.id ?? null;
}

function ChatSession({
  tripId,
  resumeId,
  bottomInset,
  onTripCreated,
  onOpenTrip,
}: {
  tripId: string | null;
  resumeId: string | null;
  bottomInset: number;
  onTripCreated: (tripId: string) => void;
  onOpenTrip: (tripId: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const listRef = useRef<FlatList<AgentMessage>>(null);
  const chat = useAgentChat({ tripId, resumeConversationId: resumeId });
  const save = useSaveBlock();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  function send(text: string): void {
    if (!text.trim() || chat.isStreaming) return;
    setDraft('');
    void chat.send(text);
  }

  async function saveBlock(block: SaveableBlock): Promise<SaveResult> {
    if (block.type !== 'trip_summary' && !tripId) {
      throw new Error('Save the trip plan first, or pick a trip at the top.');
    }
    const result = await save.mutateAsync({
      tripId: block.type === 'trip_summary' ? undefined : (tripId ?? undefined),
      conversationId: chat.conversationId ?? undefined,
      block,
    });
    // A created trip becomes the subject of this same conversation.
    if (block.type === 'trip_summary') onTripCreated(result.tripId);
    setToast(result.message);
    return result;
  }

  const lastAssistantId = [...chat.messages].reverse().find((m) => m.role === 'assistant')?.id;
  const isEmpty = chat.messages.length === 0 && !chat.isStreaming;
  const canSend = draft.trim().length > 0 && !chat.isStreaming;

  return (
    <KeyboardSafeView style={styles.flex}>
      {chat.isLoadingHistory ? (
        <LoadingState label="Loading your conversation…" />
      ) : isEmpty ? (
        <View style={styles.intro}>
          <Text style={styles.introTitle}>
            {tripId ? 'Ask me about this trip' : "Let's plan a new trip"}
          </Text>
          <Text style={styles.introBody}>
            {tripId
              ? 'I know your itinerary, packing list and bookings. Ask anything, or have me add to the plan.'
              : 'Tell me where you want to go. I will ask a couple of questions, then build the plan for you to save.'}
          </Text>
          <SuggestionsBlockView
            block={{ type: 'suggestions', chips: tripId ? TRIP_STARTERS : NEW_TRIP_STARTERS }}
            onChoice={send}
          />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={chat.messages}
          keyExtractor={(message) => message.id}
          contentContainerStyle={styles.thread}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              // Chips from an old reply are stale, so only the newest one is tappable.
              onChoice={item.id === lastAssistantId && !chat.isStreaming ? send : undefined}
              onSave={saveBlock}
              onOpenTrip={onOpenTrip}
            />
          )}
          ListFooterComponent={
            chat.live ? <LiveBubble live={chat.live} onSave={saveBlock} onOpenTrip={onOpenTrip} /> : null
          }
        />
      )}

      {toast ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View accessibilityLiveRegion="polite" style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}

      {chat.error ? <Text style={styles.error}>{chat.error}</Text> : null}

      <View style={[styles.composer, { paddingBottom: Math.max(bottomInset, spacing.md) }]}>
        <TextInput
          accessibilityLabel="Message"
          value={draft}
          onChangeText={setDraft}
          placeholder={tripId ? 'Ask about your trip…' : 'Where do you want to go?'}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          editable={!chat.isStreaming}
        />
        {chat.isStreaming ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stop"
            onPress={chat.stop}
            style={[styles.sendButton, styles.stopButton]}
          >
            <Ionicons name="stop" size={18} color={colors.textInverse} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            onPress={() => send(draft)}
            disabled={!canSend}
            style={[styles.sendButton, !canSend && styles.sendDisabled]}
          >
            <Ionicons name="send" size={18} color={colors.textInverse} />
          </Pressable>
        )}
      </View>
    </KeyboardSafeView>
  );
}

type BubbleActions = {
  onChoice?: (value: string) => void;
  onSave: (block: SaveableBlock) => Promise<SaveResult>;
  onOpenTrip: (tripId: string) => void;
};

function MessageBubble({ message, ...actions }: { message: AgentMessage } & BubbleActions) {
  if (message.role === 'user') {
    return (
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{message.text}</Text>
      </View>
    );
  }

  return (
    <AssistantRow>
      {message.blocks.length > 0 ? (
        <BlockRenderer blocks={message.blocks} {...actions} />
      ) : (
        // Pre-blocks rows, or a reply whose blocks all failed validation server-side.
        <Text style={styles.assistantText}>{message.text}</Text>
      )}
    </AssistantRow>
  );
}

/** The reply as it is being written: finished cards, the sentence still typing, then the dots. */
function LiveBubble({ live, ...actions }: { live: LiveReply } & Omit<BubbleActions, 'onChoice'>) {
  return (
    <AssistantRow>
      {live.blocks.length > 0 ? <BlockRenderer blocks={live.blocks} {...actions} /> : null}
      {live.draft ? <TextBlockView block={{ type: 'text', body: live.draft }} /> : null}
      <TypingDots />
    </AssistantRow>
  );
}

function AssistantRow({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.assistantRow}>
      <LinearGradient colors={gradients.brand} style={styles.smallAvatar}>
        <Ionicons name="sparkles" size={13} color={colors.textInverse} />
      </LinearGradient>
      <View style={styles.assistantBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  headerButton: { padding: 2 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  intro: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  introTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  introBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  thread: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: colors.brand,
    borderRadius: radii.lg,
    borderBottomRightRadius: radii.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userText: { color: colors.textInverse, fontSize: fontSize.sm, lineHeight: 20 },
  assistantRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  assistantBody: { flex: 1 },
  assistantText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  error: {
    color: colors.danger,
    fontSize: fontSize.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.text,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  toastText: { color: colors.textInverse, fontSize: fontSize.sm, fontWeight: '600' },
  composer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: { backgroundColor: colors.text },
  sendDisabled: { opacity: 0.35 },
});
