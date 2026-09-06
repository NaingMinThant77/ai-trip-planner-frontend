import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

type Props = {
  onPress: () => void;
  isLoading?: boolean;
};

/**
 * Hands off to `/auth/google/start` in a system browser — the backend owns the OAuth
 * exchange because the app must never hold the client secret.
 */
export function GoogleButton({ onPress, isLoading = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
      onPress={onPress}
      disabled={isLoading}
      style={({ pressed }) => [
        styles.button,
        pressed && !isLoading && styles.pressed,
        isLoading && styles.disabled,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.textMuted} />
      ) : (
        <>
          <View style={styles.glyph}>
            <Text style={styles.glyphText}>G</Text>
          </View>
          <Text style={styles.label}>Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 54,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
  glyph: { alignItems: 'center', justifyContent: 'center' },
  glyphText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.googleBlue,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
});
