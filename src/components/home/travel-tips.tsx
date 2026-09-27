import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

export type TravelTip = {
  key: string;
  title: string;
  body: string;
  background: string;
};

/**
 * Static, hand-written copy — deliberately not model-generated. Each card opens the assistant,
 * so the advice itself arrives in a conversation the user can push back on rather than being
 * presented here as fact.
 */
export const TRAVEL_TIPS: TravelTip[] = [
  {
    key: 'pack-light',
    title: 'Pack light',
    body: 'Capsule wardrobe tips for a week away.',
    background: colors.infoSoft,
  },
  {
    key: 'airport-day',
    title: 'Airport day',
    body: 'Timing, security, and stress-free boarding.',
    background: colors.brandSoft,
  },
  {
    key: 'eat-local',
    title: 'Eat local',
    body: 'How to find the places locals actually go.',
    background: colors.accentSoft,
  },
];

export function TravelTips({ onAsk }: { onAsk: (tip: TravelTip) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
      {TRAVEL_TIPS.map((tip) => (
        <View key={tip.key} style={[styles.card, { backgroundColor: tip.background }]}>
          <Text style={styles.title}>{tip.title}</Text>
          <Text style={styles.body}>{tip.body}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'Ask the assistant about ' + tip.title}
            onPress={() => onAsk(tip)}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          >
            <Text style={styles.linkLabel}>Ask AI</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.brandDark} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  card: {
    width: 190,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginRight: spacing.md,
  },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  body: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 17 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.md },
  linkLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDark },
  pressed: { opacity: 0.6 },
});
