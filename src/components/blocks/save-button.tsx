import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';
import { SaveResult } from '../../types/blocks';

type Phase = 'idle' | 'saving' | 'saved';

/**
 * The "Save to trip" action under a card. Saving is one-way and not idempotent for new trips,
 * so once it succeeds the button stays on its confirmation rather than offering a second tap.
 */
export function SaveButton({
  label = 'Save to trip',
  onSave,
  onSaved,
  compact = false,
}: {
  label?: string;
  onSave: () => Promise<SaveResult>;
  onSaved?: (result: SaveResult) => void;
  compact?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function press(): Promise<void> {
    if (phase !== 'idle') return;
    setPhase('saving');
    setError(null);
    try {
      const result = await onSave();
      setMessage(result.message);
      setPhase('saved');
      onSaved?.(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save.');
      setPhase('idle');
    }
  }

  const isSaved = phase === 'saved';

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isSaved ? (message ?? 'Saved') : label}
        accessibilityState={{ disabled: phase !== 'idle', busy: phase === 'saving' }}
        disabled={phase !== 'idle'}
        onPress={() => void press()}
        style={({ pressed }) => [
          styles.button,
          compact && styles.compact,
          isSaved && styles.saved,
          pressed && styles.pressed,
        ]}
      >
        {phase === 'saving' ? (
          <ActivityIndicator size="small" color={colors.brandDark} />
        ) : (
          <Ionicons
            name={isSaved ? 'checkmark-circle' : 'bookmark-outline'}
            size={compact ? 14 : 16}
            color={isSaved ? colors.success : colors.brandDark}
          />
        )}
        <Text style={[styles.label, isSaved && styles.savedLabel]}>
          {isSaved ? (message ?? 'Saved') : phase === 'saving' ? 'Saving…' : label}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.brandSoft,
  },
  compact: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md, marginTop: spacing.xs },
  saved: { backgroundColor: colors.surface },
  pressed: { opacity: 0.75 },
  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDark },
  savedLabel: { color: colors.success },
  error: { marginTop: spacing.xs, fontSize: fontSize.xs, color: colors.danger },
});
