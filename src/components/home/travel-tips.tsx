import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

export type TravelTip = {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  /** Two-stop gradient behind the card. */
  gradient: readonly [string, string];
  title: string;
  body: string;
};

/**
 * Static, hand-written copy — deliberately not model-generated. Each card opens the assistant,
 * so the advice itself arrives in a conversation the user can push back on rather than being
 * presented here as fact.
 */
export const TRAVEL_TIPS: TravelTip[] = [
  {
    key: 'pack-light',
    icon: 'bag-handle',
    gradient: ['#5B9CF5', '#3B6FE0'],
    title: 'Pack light',
    body: 'Capsule wardrobe tips for a week away.',
  },
  {
    key: 'airport-day',
    icon: 'airplane',
    gradient: ['#12B5A0', '#0B7F73'],
    title: 'Airport day',
    body: 'Timing, security, and stress-free boarding.',
  },
  {
    key: 'eat-local',
    icon: 'restaurant',
    gradient: ['#F59A5B', '#E0662A'],
    title: 'Eat local',
    body: 'How to find the places locals actually go.',
  },
];

export function TravelTips({ onAsk }: { onAsk: (tip: TravelTip) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
      {TRAVEL_TIPS.map((tip) => (
        <LinearGradient
          key={tip.key}
          colors={tip.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Ionicons name={tip.icon} size={84} color="rgba(255,255,255,0.16)" style={styles.watermark} />
          <View style={styles.iconTile}>
            <Ionicons name={tip.icon} size={18} color={tip.gradient[1]} />
          </View>
          <Text style={styles.title}>{tip.title}</Text>
          <Text style={styles.body}>{tip.body}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'Ask the assistant about ' + tip.title}
            onPress={() => onAsk(tip)}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          >
            <Text style={styles.linkLabel}>Ask AI</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.textInverse} />
          </Pressable>
        </LinearGradient>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  card: {
    width: 196,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  watermark: { position: 'absolute', right: -14, bottom: -14 },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: fontSize.md, fontWeight: '800', color: colors.textInverse },
  body: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.9)', marginTop: spacing.xs, lineHeight: 17 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.md },
  linkLabel: { fontSize: fontSize.sm, fontWeight: '800', color: colors.textInverse },
  pressed: { opacity: 0.7 },
});
