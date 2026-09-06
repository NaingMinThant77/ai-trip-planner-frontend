import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

type Props = {
  /** `light` for the wordmark over a photo, `dark` for it on a white background. */
  tone?: 'light' | 'dark';
};

export function BrandHeader({ tone = 'dark' }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.badge}>
        <Ionicons name="airplane" size={16} color={colors.brand} />
      </View>
      <Text style={[styles.wordmark, tone === 'light' && styles.wordmarkLight]}>
        AI Trip Planner
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  wordmarkLight: { color: colors.textInverse },
});
