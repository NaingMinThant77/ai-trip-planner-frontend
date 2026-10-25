import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';
import { SuggestionsBlock } from '../../types/blocks';

/**
 * Follow-up chips. Rendered only when there is a handler: on an older message the chips are
 * stale (the conversation moved on), so the thread passes no handler and nothing shows.
 */
export function SuggestionsBlockView({
  block,
  onChoice,
}: {
  block: SuggestionsBlock;
  onChoice?: (value: string) => void;
}) {
  if (!onChoice) return null;

  return (
    <View style={styles.row}>
      {block.chips.map((chip) => (
        <Pressable
          key={chip}
          accessibilityRole="button"
          onPress={() => onChoice(chip)}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
        >
          <Text style={styles.label}>{chip}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.brand,
    backgroundColor: colors.background,
  },
  pressed: { backgroundColor: colors.brandSoft },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.brandDark },
});
