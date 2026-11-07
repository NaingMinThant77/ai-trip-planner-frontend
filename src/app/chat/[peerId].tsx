import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useState } from 'react';
import { ApiError } from '../../api/client';
import { useAuth } from '../../context/auth';
import { useChatThread, useSendMessage } from '../../hooks/use-chat';
import { useRemoveFamilyMember } from '../../hooks/use-family';
import { initialsOf } from '../../components/profile/gradient-header';
import { colors, fontSize, radii, spacing } from '../../theme';
import { ErrorState, LoadingState } from '../../components/ui/screen-state';
import { Message } from '../../types/api';
import { confirmAction } from '../../components/ui/confirm-host';
import { KeyboardSafeView } from '../../components/ui/keyboard-safe-view';

export default function ChatScreen() {
  const params = useLocalSearchParams<{ peerId: string; name?: string; memberId?: string; avatarUrl?: string }>();
  const peerId = params.peerId ?? '';
  const peerName = params.name ?? 'Chat';
  const memberId = params.memberId;

  const router = useRouter();
  const { user } = useAuth();
  const thread = useChatThread(peerId);
  const sendMessage = useSendMessage(peerId);
  const removeMember = useRemoveFamilyMember();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<Row>>(null);

  function handleRemoveMember(): void {
    if (!memberId || removeMember.isPending) return;
    confirmAction({
      title: 'Unfriend?',
      message: `Are you sure you want to unfriend ${peerName}?`,
      confirmLabel: 'Unfriend',
      icon: 'person-remove',
      onConfirm: () =>
        removeMember.mutate(memberId, {
          onSuccess: () => router.back(),
          onError: (error) => {
            Alert.alert(
              'Could not remove',
              error instanceof ApiError ? error.message : 'Please try again.',
            );
          },
        }),
    });
  }

  const messages = thread.data ?? [];
  const rows = withDaySeparators(messages);

  useEffect(() => {
    if (messages.length > 0) {
      // A short delay lets the new row actually lay out before scrolling to it.
      const id = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      return () => clearTimeout(id);
    }
  }, [messages.length]);

  function handleSend(): void {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDraft('');
    sendMessage.send(trimmed);
  }

  if (thread.isPending) return <LoadingState label={`Loading your chat with ${peerName}…`} />;

  if (thread.isError) {
    return (
      <ErrorState
        message={thread.error instanceof ApiError ? thread.error.message : 'Could not load messages.'}
        onRetry={() => void thread.refetch()}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerTitle}>
              {params.avatarUrl ? (
                <Image source={{ uri: params.avatarUrl }} style={styles.headerAvatar} contentFit="cover" />
              ) : (
                <View style={styles.headerAvatar}>
                  <Text style={styles.headerAvatarText}>{initialsOf(peerName)}</Text>
                </View>
              )}
              <Text style={styles.headerName} numberOfLines={1}>
                {peerName}
              </Text>
            </View>
          ),
          headerRight: memberId
            ? () => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${peerName}`}
                  onPress={handleRemoveMember}
                  disabled={removeMember.isPending}
                  hitSlop={8}
                  style={({ pressed }) => (pressed || removeMember.isPending) && styles.headerActionPressed}
                >
                  <Ionicons name="person-remove-outline" size={22} color={colors.danger} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <KeyboardSafeView iosOffset={96}
        style={styles.flex}
      >
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Say hello to {peerName}</Text>
            <Text style={styles.emptyBody}>Messages are only visible to the two of you.</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={rows}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) =>
              item.type === 'day' ? (
                <DaySeparator label={item.label} />
              ) : (
                <Bubble message={item.message} isMine={item.message.senderId === user?.id} />
              )
            }
          />
        )}

        {sendMessage.error ? <Text style={styles.sendError}>{sendMessage.error}</Text> : null}

        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Message"
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={colors.textMuted}
            multiline
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            onPress={handleSend}
            disabled={draft.trim().length === 0}
            style={({ pressed }) => [
              styles.sendButton,
              (pressed || draft.trim().length === 0) && styles.sendButtonDisabled,
            ]}
          >
            <Ionicons name="send" size={18} color={colors.textInverse} />
          </Pressable>
        </View>
      </KeyboardSafeView>
    </>
  );
}

type Row =
  | { type: 'day'; key: string; label: string }
  | { type: 'message'; key: string; message: Message };

/** Inserts a "Today / Yesterday / Saturday, 7 Nov" divider whenever the calendar day changes. */
function withDaySeparators(messages: Message[]): Row[] {
  const rows: Row[] = [];
  let lastDay = '';
  for (const message of messages) {
    const date = new Date(message.createdAt);
    const day = date.toDateString();
    if (day !== lastDay) {
      rows.push({ type: 'day', key: `day-${day}`, label: dayLabel(date) });
      lastDay = day;
    }
    rows.push({ type: 'message', key: message.id, message });
  }
  return rows;
}

function dayLabel(date: Date): string {
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

function DaySeparator({ label }: { label: string }) {
  return (
    <View style={styles.dayRow}>
      <View style={styles.dayLine} />
      <Text style={styles.dayLabel}>{label}</Text>
      <View style={styles.dayLine} />
    </View>
  );
}

function Bubble({ message, isMine }: { message: Message; isMine: boolean }) {
  const time = new Date(message.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const content = (
    <>
      <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{message.text}</Text>
      <View style={styles.bubbleFooter}>
        <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>{time}</Text>
        {isMine ? (
          <Ionicons
            name={message.readAt ? 'checkmark-done' : 'checkmark'}
            size={14}
            color={message.readAt ? '#9BE7FF' : 'rgba(255,255,255,0.75)'}
            style={styles.readIcon}
          />
        ) : null}
      </View>
    </>
  );

  return (
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      {isMine ? (
        <LinearGradient
          colors={['#12B5A0', '#0B7F73']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.bubbleMine]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.bubbleTheirs]}>{content}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: colors.brandDark, fontWeight: '700', fontSize: fontSize.xs },
  headerName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, maxWidth: 180 },
  headerActionPressed: { opacity: 0.6 },
  flex: { flex: 1, backgroundColor: '#EEF6F4' },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.md },
  dayLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  list: { padding: spacing.lg, gap: spacing.sm },
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bubbleTheirs: { backgroundColor: colors.background, borderBottomLeftRadius: radii.sm },
  bubbleMine: { borderBottomRightRadius: radii.sm },
  bubbleText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  bubbleTextMine: { color: colors.textInverse },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
  bubbleTime: { fontSize: 10, color: colors.textMuted },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },
  readIcon: { marginLeft: 4 },
  sendError: {
    fontSize: fontSize.xs,
    color: colors.danger,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
});
