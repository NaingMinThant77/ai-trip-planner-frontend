import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

type Props = {
  /** `light` for the wordmark over a photo, `dark` for it on a white background. */
  tone?: 'light' | 'dark';
};

export function BrandHeader({ tone = 'dark' }: Props) {
  return (
    <View style={styles.row}>
      <Image
        source={require('../../../assets/trip_planner/ai_trip_planner_icon.png')}
        style={styles.icon}
        contentFit="cover"
        accessibilityLabel="AI Trip Planner"
      />
      <Text style={[styles.wordmark, tone === 'light' && styles.wordmarkLight]}>
        Wayfarer: AI Trip Planner
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 32, height: 32, borderRadius: radii.pill },
  wordmark: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  wordmarkLight: { color: colors.textInverse },
});
