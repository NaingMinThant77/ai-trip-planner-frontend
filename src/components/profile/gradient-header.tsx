import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, gradients, radii, spacing } from '../../theme';

type Props = {
  title: string;
  subtitle?: string;
  /** Rendered inside the circle. Initials for a person, an icon elsewhere. */
  badge?: string;
  /** Wins over `badge` when set — the avatar fills the circle. */
  imageUrl?: string | null;
};

/** The teal cap the redesigned Profile and Family tabs sit under. Presentational only. */
export function GradientHeader({ title, subtitle, badge, imageUrl }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradients.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.avatar}
          contentFit="cover"
          // Keeps the old avatar on screen while a replacement loads, instead of flashing.
          transition={150}
          accessibilityLabel={`${title}'s profile photo`}
        />
      ) : badge ? (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{badge}</Text>
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: '700' },
  title: { color: colors.textInverse, fontSize: fontSize.xl, fontWeight: '700' },
  subtitle: {
    color: colors.textInverse,
    opacity: 0.85,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
