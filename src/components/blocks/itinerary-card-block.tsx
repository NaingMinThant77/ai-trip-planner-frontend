import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing, timeOfDayLabel } from '../../theme';
import { ItineraryCardBlock, SaveResult } from '../../types/blocks';
import { BlockCard } from './block-card';
import { SaveButton } from './save-button';

export function ItineraryCardBlockView({
  block,
  onSave,
}: {
  block: ItineraryCardBlock;
  onSave?: () => Promise<SaveResult>;
}) {
  return (
    <BlockCard heading={`Day ${block.dayNumber} · ${block.title}`}>
      <Text style={styles.summary}>{block.summary}</Text>

      {block.items.map((item, index) => (
        <View key={`${item.title}-${index}`} style={styles.row}>
          <Text style={styles.slot}>{labelFor(item.timeOfDay)}</Text>
          <View style={styles.rowBody}>
            <Text style={styles.title}>{item.title}</Text>
            {item.location ? <Text style={styles.location}>{item.location}</Text> : null}
          </View>
        </View>
      ))}

      {onSave ? <SaveButton label={`Save day ${block.dayNumber} to trip`} onSave={onSave} /> : null}
    </BlockCard>
  );
}

/** The model sends a free string here, so fall back to it rather than dropping the row. */
function labelFor(timeOfDay: string): string {
  if (timeOfDay === 'morning' || timeOfDay === 'afternoon' || timeOfDay === 'evening') {
    return timeOfDayLabel[timeOfDay];
  }
  return timeOfDay;
}

const styles = StyleSheet.create({
  summary: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  row: { flexDirection: 'row', marginBottom: spacing.sm, gap: spacing.sm },
  slot: {
    width: 72,
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
    paddingTop: 2,
  },
  rowBody: { flex: 1 },
  title: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  location: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
});
