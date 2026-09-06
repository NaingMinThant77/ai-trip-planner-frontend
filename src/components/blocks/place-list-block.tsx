import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../../theme';
import { PlaceListBlock } from '../../types/blocks';
import { BlockCard } from './block-card';

export function PlaceListBlockView({ block }: { block: PlaceListBlock }) {
  return (
    <BlockCard heading={block.heading}>
      {block.places.map((place, index) => (
        <View key={`${place.name}-${index}`} style={styles.row}>
          <View style={styles.bullet} />
          <View style={styles.body}>
            <Text style={styles.name}>{place.name}</Text>
            {place.location ? <Text style={styles.location}>{place.location}</Text> : null}
            {place.reason ? <Text style={styles.reason}>{place.reason}</Text> : null}
          </View>
        </View>
      ))}
    </BlockCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  body: { flex: 1 },
  name: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  location: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  reason: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 17 },
});
