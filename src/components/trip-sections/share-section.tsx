import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { API_ORIGIN, ApiError } from '../../api/client';
import {
  useAddCollaborator,
  useCollaborators,
  useRemoveCollaborator,
  useShareState,
  useToggleShare,
} from '../../hooks/use-sharing';
import { colors, fontSize, radii, spacing } from '../../theme';
import { Button } from '../ui/button';
import { ErrorState, LoadingState } from '../ui/screen-state';
import { TextField } from '../ui/text-field';

export function ShareSection({ tripId, tripTitle }: { tripId: string; tripTitle: string }) {
  const shareState = useShareState(tripId);
  const toggleShare = useToggleShare(tripId);
  const collaborators = useCollaborators(tripId);
  const addCollaborator = useAddCollaborator(tripId);
  const removeCollaborator = useRemoveCollaborator(tripId);

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (shareState.isPending) return <LoadingState label="Loading sharing settings…" />;

  if (shareState.isError) {
    return (
      <ErrorState
        message={
          shareState.error instanceof ApiError
            ? shareState.error.message
            : 'Could not load sharing settings.'
        }
        onRetry={() => void shareState.refetch()}
      />
    );
  }

  const shareUrl = shareState.data.sharePath ? `${API_ORIGIN}/api${shareState.data.sharePath}` : null;

  async function handleShare(): Promise<void> {
    if (!shareUrl) return;
    // The OS sheet is the only thing that actually sends anything — nothing is emailed by us.
    await Share.share({ message: `${tripTitle} — our itinerary:\n${shareUrl}` });
  }

  async function handleCopy(): Promise<void> {
    if (!shareUrl) return;
    await Clipboard.setStringAsync(shareUrl);
    Alert.alert('Link copied', 'Paste it wherever you like.');
  }

  function handleToggle(next: boolean): void {
    if (!next) {
      Alert.alert('Stop sharing?', 'The existing link will stop working immediately.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop sharing', style: 'destructive', onPress: () => toggleShare.mutate(false) },
      ]);
      return;
    }
    toggleShare.mutate(true);
  }

  function handleAdd(): void {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    addCollaborator.mutate(
      { email: trimmed },
      {
        onSuccess: () => setEmail(''),
        onError: (caught) =>
          setError(caught instanceof ApiError ? caught.message : 'Could not add that person.'),
      },
    );
  }

  return (
    <View>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.cardTitle}>Share this itinerary</Text>
            <Text style={styles.cardBody}>
              Creates a read-only link. Anyone with it can see the plan — no account needed.
            </Text>
          </View>
          <Switch
            value={shareState.data.isShared}
            onValueChange={handleToggle}
            disabled={toggleShare.isPending}
          />
        </View>

        {shareState.data.isShared && shareUrl ? (
          <View style={styles.linkBlock}>
            <Text style={styles.link} numberOfLines={1}>
              {shareUrl}
            </Text>
            <View style={styles.linkActions}>
              <Button label="Share" onPress={() => void handleShare()} style={styles.linkButton} />
              <Button
                label="Copy"
                variant="secondary"
                onPress={() => void handleCopy()}
                style={styles.linkButton}
              />
            </View>
            <Text style={styles.note}>
              Your notes, budget and email stay private — only the day-by-day plan is shared.
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Family and friends</Text>
      <Text style={styles.sectionBody}>
        Keep track of who you sent the link to. Adding someone here does not email them.
      </Text>

      {(collaborators.data ?? []).map((person) => (
        <View key={person.id} style={styles.person}>
          <View style={styles.personText}>
            <Text style={styles.personName}>{person.name ?? person.email}</Text>
            {person.name ? <Text style={styles.personEmail}>{person.email}</Text> : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${person.email}`}
            onPress={() => removeCollaborator.mutate(person.id)}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      ))}

      <TextField
        label="Add someone"
        value={email}
        onChangeText={setEmail}
        placeholder="mum@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        error={error}
      />
      <Button label="Add" onPress={handleAdd} isLoading={addCollaborator.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchText: { flex: 1 },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  cardBody: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  linkBlock: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  link: {
    fontSize: fontSize.xs,
    color: colors.primaryDark,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  linkActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  linkButton: { flex: 1 },
  note: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.md, lineHeight: 17 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  sectionBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  personText: { flex: 1 },
  personName: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  personEmail: { fontSize: fontSize.xs, color: colors.textMuted },
});
