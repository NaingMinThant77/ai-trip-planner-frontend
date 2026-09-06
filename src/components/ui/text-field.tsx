import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = TextInputProps & {
  label: string;
  error?: string | null;
  /** Leading glyph inside the field. Omit for a plain input. */
  icon?: IconName;
  /** `pill` is the rounded, filled treatment used by the auth screens. */
  variant?: 'default' | 'pill';
};

export function TextField({
  label,
  error,
  icon,
  variant = 'default',
  style,
  secureTextEntry,
  ...inputProps
}: Props) {
  const isPill = variant === 'pill';
  const [isRevealed, setIsRevealed] = useState(false);

  // Every password field gets the eye, because the toggle lives here rather than at the call
  // sites. Masking resumes as soon as `secureTextEntry` is no longer requested.
  const isSecret = Boolean(secureTextEntry);
  const isMasked = isSecret && !isRevealed;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, isPill && styles.fieldPill, Boolean(error) && styles.fieldError]}>
        {icon ? (
          <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.icon} />
        ) : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          secureTextEntry={isMasked}
          {...inputProps}
        />
        {isSecret ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isMasked ? `Show ${label}` : `Hide ${label}`}
            accessibilityState={{ selected: isRevealed }}
            onPress={() => setIsRevealed((current) => !current)}
            // Enlarged tap area: the glyph alone is well under the 44pt minimum.
            hitSlop={spacing.sm}
            style={({ pressed }) => [styles.reveal, pressed && styles.revealPressed]}
          >
            <Ionicons
              name={isMasked ? 'eye-outline' : 'eye-off-outline'}
              size={19}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {Boolean(error) && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  fieldPill: {
    minHeight: 54,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  fieldError: { borderColor: colors.danger },
  icon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  reveal: { paddingLeft: spacing.sm },
  revealPressed: { opacity: 0.5 },
  error: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: fontSize.xs,
  },
});
