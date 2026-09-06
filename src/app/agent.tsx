import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ApiError } from '../api/client';
import { BlockRenderer } from '../components/blocks/block-renderer';
import { useMessages, useSendMessage } from '../hooks/use-agent';
import { colors, fontSize, radii, spacing } from '../theme';
import { AgentMessage } from '../types/blocks';

const STARTERS = [
  'Plan a long weekend somewhere warm',
  'What should I pack for a rainy city break?',
  'Where can I go in March with good hiking?',
];

export default function AgentScreen() {
  const params = useLocalSearchParams<{ tripId?: string }>();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<AgentMessage>>(null);

  const messages = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId, params.tripId);

  function send(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || sendMessage.isPending) return;

    setError(null);
    setDraft('');

    sendMessage.mutate(trimmed, {
      // The first reply is what tells us which conversation we are in.
      onSuccess: (reply) => setConversationId(reply.conversationId),
      onError: (caught) =>
        setError(caught instanceof ApiError ? caught.message : 'The assistant did not reply.'),
    });
  }

  const thread = messages.data ?? [];
  const isEmpty = thread.length === 0 && !sendMessage.isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
      style={styles.flex}
    >
      {isEmpty ? (
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Ask about anything travel</Text>
          <Text style={styles.introBody}>
            The assistant answers with real cards — itineraries, place lists, packing ideas —
            not walls of text.
          </Text>

          {STARTERS.map((starter) => (
            <Pressable key={starter} style={styles.starter} onPress={() => send(starter)}>
              <Text style={styles.starterText}>{starter}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={thread}
          keyExtractor={(message) => message.id}
          contentContainerStyle={styles.thread}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => <MessageBubble message={item} onChoice={send} />}
          ListFooterComponent={
            sendMessage.isPending ? (
              <View style={styles.thinking}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.thinkingText}>Thinking…</Text>
              </View>
            ) : null
          }
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="Message"
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask about your trip…"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          onSubmitEditing={() => send(draft)}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          onPress={() => send(draft)}
          disabled={!draft.trim() || sendMessage.isPending}
          style={[
            styles.sendButton,
            (!draft.trim() || sendMessage.isPending) && styles.sendDisabled,
          ]}
        >
          <Text style={styles.sendLabel}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  message,
  onChoice,
}: {
  message: AgentMessage;
  onChoice: (value: string) => void;
}) {
  if (message.role === 'user') {
    return (
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{message.text}</Text>
      </View>
    );
  }

  return (
    <View style={styles.assistantBubble}>
      {message.blocks.length > 0 ? (
        <BlockRenderer blocks={message.blocks} onChoice={onChoice} />
      ) : (
        // Pre-blocks rows, or a reply whose blocks all failed validation server-side.
        <Text style={styles.assistantText}>{message.text}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  intro: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  introTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  introBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  starter: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  starterText: { fontSize: fontSize.sm, color: colors.text },
  thread: { padding: spacing.lg, gap: spacing.md },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  userText: { color: colors.textInverse, fontSize: fontSize.sm, lineHeight: 20 },
  assistantBubble: { alignSelf: 'stretch' },
  assistantText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  thinkingText: { fontSize: fontSize.sm, color: colors.textMuted },
  error: {
    color: colors.danger,
    fontSize: fontSize.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  composer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
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
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  sendButton: {
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendLabel: { color: colors.textInverse, fontWeight: '600', fontSize: fontSize.sm },
});
