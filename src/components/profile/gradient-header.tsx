import { Image, ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, radii, spacing } from '../../theme';

type Props = {
  title: string;
  /** Shown as a soft pill under the title (an email, a member count). */
  subtitle?: string;
  /** Rendered inside the circle. Initials for a person, an emoji elsewhere. */
  badge?: string;
  /** Wins over `badge` when set — the avatar fills the circle. */
  imageUrl?: string | null;
  /** A bundled image (e.g. the app icon); used when there is no `imageUrl`. */
  imageSource?: ImageSource;
};

/**
 * The light, left-aligned cap the Profile and Members tabs sit under: a soft mint wash with
 * two translucent shapes for depth, a ringed avatar and a pill subtitle. Presentational only.
 */
export function GradientHeader({ title, subtitle, badge, imageUrl, imageSource }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#CFF1E9', '#E8F7F3', '#F6F7F9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
    >
      <View pointerEvents="none" style={styles.blobLarge} />
      <View pointerEvents="none" style={styles.blobSmall} />

      <View style={styles.ring}>
        {imageUrl || imageSource ? (
          <Image
            source={imageUrl ? { uri: imageUrl } : imageSource}
            style={styles.avatar}
            contentFit="cover"
            // Keeps the old avatar on screen while a replacement loads, instead of flashing.
            transition={150}
            accessibilityLabel={`${title}'s profile photo`}
          />
        ) : (
          <LinearGradient colors={['#12B5A0', '#0B6A62']} style={styles.avatar}>
            {badge ? <Text style={styles.avatarText}>{badge}</Text> : null}
          </LinearGradient>
        )}
      </View>

      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <View style={styles.pill}>
            <Text style={styles.pillText} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}

/** First letters of the first two words — "Ada Lovelace" becomes "AL". */
export function initialsOf(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('');

  return letters.toUpperCase() || '?';
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: 'hidden',
  },
  blobLarge: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(14,138,125,0.12)',
  },
  blobSmall: {
    position: 'absolute',
    bottom: -30,
    right: 90,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(224,122,63,0.14)',
  },
  ring: {
    padding: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    shadowColor: '#0B5F58',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { color: colors.textInverse, fontSize: fontSize.xl, fontWeight: '800' },
  text: { flex: 1, alignItems: 'flex-start', gap: spacing.xs },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800', letterSpacing: -0.3 },
  pill: {
    maxWidth: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  pillText: { color: colors.brandDark, fontSize: fontSize.xs, fontWeight: '600' },
});
