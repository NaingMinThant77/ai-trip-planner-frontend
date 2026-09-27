import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
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

export default function ChatScreen() {
  const params = useLocalSearchParams<{ peerId: string; name?: string; memberId?: string }>();
  const peerId = params.peerId ?? '';
  const peerName = params.name ?? 'Chat';
  const memberId = params.memberId;

  const router = useRouter();
  const { user } = useAuth();
  const thread = useChatThread(peerId);
  const sendMessage = useSendMessage(peerId);
  const removeMember = useRemoveFamilyMember();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  function handleRemoveMember(): void {
    if (!memberId || removeMember.isPending) return;
    removeMember.mutate(memberId, {
      onSuccess: () => router.back(),
      onError: (error) => {
        Alert.alert(
          'Could not remove',
          error instanceof ApiError ? error.message : 'Please try again.',
        );
      },
    });
  }

  const messages = thread.data ?? [];

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
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>{initialsOf(peerName)}</Text>
              </View>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
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
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => <Bubble message={item} isMine={item.senderId === user?.id} />}
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
      </KeyboardAvoidingView>
    </>
  );
}

function Bubble({ message, isMine }: { message: Message; isMine: boolean }) {
  const time = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{message.text}</Text>
        <View style={styles.bubbleFooter}>
          <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>{time}</Text>
          {isMine ? (
            <Ionicons
              name={message.readAt ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={message.readAt ? colors.info : 'rgba(255,255,255,0.7)'}
              style={styles.readIcon}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: { alignItems: 'center' },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  headerAvatarText: { color: colors.brandDark, fontWeight: '700', fontSize: fontSize.xs },
  headerName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, maxWidth: 180 },
  headerActionPressed: { opacity: 0.6 },
  flex: { flex: 1, backgroundColor: colors.surface },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  list: { padding: spacing.lg, gap: spacing.sm },
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  bubbleTheirs: { backgroundColor: colors.background, borderBottomLeftRadius: radii.sm },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: radii.sm },
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
});
