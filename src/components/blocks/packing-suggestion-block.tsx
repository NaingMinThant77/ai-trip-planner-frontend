import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';
import { PackingSuggestionBlock, SaveResult } from '../../types/blocks';
import { BlockCard } from './block-card';
import { SaveButton } from './save-button';

export function PackingSuggestionBlockView({
  block,
  onSave,
}: {
  block: PackingSuggestionBlock;
  onSave?: () => Promise<SaveResult>;
}) {
  return (
    <BlockCard heading={block.heading}>
      <View style={styles.grid}>
        {block.items.map((item, index) => (
          <View key={`${item.label}-${index}`} style={styles.pill}>
            <Text style={styles.label}>
              {item.quantity > 1 ? `${item.quantity} × ${item.label}` : item.label}
            </Text>
          </View>
        ))}
      </View>
      {onSave ? <SaveButton label="Add to packing list" onSave={onSave} /> : null}
    </BlockCard>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  pill: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: { fontSize: fontSize.xs, color: colors.text },
});
