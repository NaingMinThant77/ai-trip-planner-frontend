import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../../theme';
import { WeatherBlock } from '../../types/blocks';
import { BlockCard } from './block-card';

export function WeatherBlockView({ block }: { block: WeatherBlock }) {
  const hasRange = block.averageHighC !== null || block.averageLowC !== null;

  return (
    <BlockCard
      heading={block.location ? `Typical weather · ${block.location}` : 'Typical weather'}
      // The model has no live data. Saying so is a product requirement, not politeness.
      footnote="Seasonal averages, not a forecast."
    >
      <Text style={styles.summary}>{block.summary}</Text>

      {hasRange ? (
        <View style={styles.range}>
          {block.averageHighC !== null ? (
            <Text style={styles.temp}>High {Math.round(block.averageHighC)}°C</Text>
          ) : null}
          {block.averageLowC !== null ? (
            <Text style={styles.temp}>Low {Math.round(block.averageLowC)}°C</Text>
          ) : null}
        </View>
      ) : null}
    </BlockCard>
  );
}

const styles = StyleSheet.create({
  summary: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  range: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  temp: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primaryDark },
});
