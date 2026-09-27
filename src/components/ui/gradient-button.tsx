import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, ColorValue, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fontSize, gradients, radii, spacing } from '../../theme';

type Props = {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  /**
   * Overrides the default brand teal gradient — e.g. one of `jellyGradients` on the Trip
   * Detail redesign. Defaults to `gradients.brand` so every existing call site is unaffected.
   */
  gradientColors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
};

/** The brand call-to-action. Solid `Button` stays the default everywhere else. */
export function GradientButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  style,
  gradientColors,
}: Props) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.pressable,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors ?? gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      >
        {/* The spinner replaces the label so the button keeps its width mid-request. */}
        {isLoading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.5 },
  label: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
