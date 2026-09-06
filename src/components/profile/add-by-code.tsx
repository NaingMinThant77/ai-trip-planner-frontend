import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

type Props = {
  /** Resolves when the add succeeded, so the field only clears on success. */
  onAdd: (code: string) => Promise<void>;
  isPending?: boolean;
};

const CODE_LENGTH = 6;

export function AddByCode({ onAdd, isPending = false }: Props) {
  const [code, setCode] = useState('');
  const trimmed = code.replace(/[\s-]/g, '');
  const canSubmit = trimmed.length === CODE_LENGTH && !isPending;

  async function handleAdd(): Promise<void> {
    if (!canSubmit) return;
    try {
      await onAdd(trimmed);
      setCode('');
    } catch {
      // The caller has already reported it. Keeping the code on screen lets the user fix a
      // typo instead of retyping all six characters.
    }
  }

  return (
    <View style={styles.row}>
      <TextInput
        accessibilityLabel="Invite code"
        value={code}
        onChangeText={(next) => setCode(next.toUpperCase())}
        placeholder="Enter code"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={CODE_LENGTH + 2}
        returnKeyType="done"
        onSubmitEditing={() => void handleAdd()}
        style={styles.input}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit, busy: isPending }}
        onPress={() => void handleAdd()}
        disabled={!canSubmit}
        style={({ pressed }) => [
          styles.button,
          pressed && canSubmit && styles.pressed,
          !canSubmit && styles.disabled,
        ]}
      >
        {isPending ? (
          <ActivityIndicator color={colors.textInverse} size="small" />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={15} color={colors.textInverse} />
            <Text style={styles.label}>Add</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.md,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.text,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth: 96,
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
  label: { color: colors.textInverse, fontSize: fontSize.sm, fontWeight: '700' },
});
