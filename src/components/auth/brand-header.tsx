import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

type Props = {
  /** `light` for the wordmark over a photo, `dark` for it on a light background. */
  tone?: 'light' | 'dark';
};

/**
 * The auth screens' logo lockup: the app icon in a ringed tile beside a two-line wordmark,
 * all inside a pill — frosted glass over a photo, white with a soft shadow on a light page.
 */
export function BrandHeader({ tone = 'dark' }: Props) {
  const isLight = tone === 'light';

  return (
    <View style={[styles.pill, isLight ? styles.pillLight : styles.pillDark]}>
      <View style={[styles.ring, isLight && styles.ringLight]}>
        <Image
          source={require('../../../assets/trip_planner/ai_trip_planner_icon.png')}
          style={styles.icon}
          contentFit="cover"
          accessibilityLabel="AI Trip Planner"
        />
      </View>
      <View style={styles.text}>
        <Text style={[styles.name, isLight && styles.nameLight]}>Wayfarer</Text>
        <Text style={[styles.tagline, isLight && styles.taglineLight]}>AI TRIP PLANNER</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.xs + 2,
    paddingLeft: spacing.xs + 2,
    paddingRight: spacing.lg,
    borderRadius: radii.pill,
  },
  pillLight: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  pillDark: {
    backgroundColor: colors.background,
    shadowColor: '#0B5F58',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  ring: {
    padding: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.brandSoft,
  },
  ringLight: { backgroundColor: 'rgba(255,255,255,0.95)' },
  icon: { width: 40, height: 40, borderRadius: radii.pill },
  text: { gap: 1 },
  name: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.text,
  },
  nameLight: { color: colors.textInverse },
  tagline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: colors.brand,
  },
  taglineLight: { color: 'rgba(255,255,255,0.8)' },
});
