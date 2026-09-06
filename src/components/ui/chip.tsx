import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

type Props = {
  label: string;
  isSelected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, isSelected = false, onPress }: Props) {
  const isInteractive = typeof onPress === 'function';

  return (
    <Pressable
      accessibilityRole={isInteractive ? 'button' : undefined}
      accessibilityState={isInteractive ? { selected: isSelected } : undefined}
      onPress={onPress}
      disabled={!isInteractive}
      style={[styles.chip, isSelected && styles.selected]}
    >
      <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  selected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  label: { fontSize: fontSize.sm, color: colors.textMuted },
  labelSelected: { color: colors.primaryDark, fontWeight: '600' },
});
