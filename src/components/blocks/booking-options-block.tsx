import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../../theme';
import { BookingOptionsBlock, SaveResult } from '../../types/blocks';
import { BlockCard } from './block-card';
import { SaveButton } from './save-button';

export function BookingOptionsBlockView({
  block,
  onSaveOption,
}: {
  block: BookingOptionsBlock;
  /** Saves a single option, so each row has its own button. */
  onSaveOption?: (option: BookingOptionsBlock['options'][number]) => Promise<SaveResult>;
}) {
  return (
    <BlockCard
      heading={block.heading}
      // Required, not decorative — see the bookings boundary in memory/01-product.md.
      footnote="Indicative examples for orientation. Not live availability or a quote."
    >
      {block.options.map((option, index) => (
        <View key={`${option.title}-${index}`} style={styles.row}>
          <View style={styles.header}>
            <Text style={styles.title}>{option.title}</Text>
            {option.priceText ? <Text style={styles.price}>{option.priceText}</Text> : null}
          </View>
          <Text style={styles.detail}>{option.detail}</Text>
          <Text style={styles.provider}>{option.provider}</Text>
          {onSaveOption ? (
            <SaveButton compact label="Save to trip" onSave={() => onSaveOption(option)} />
          ) : null}
        </View>
      ))}
    </BlockCard>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  price: { fontSize: fontSize.xs, color: colors.primaryDark, fontWeight: '600' },
  detail: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  provider: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
});
