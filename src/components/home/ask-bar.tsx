import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

/**
 * The entry point to the assistant. Deliberately a button styled like an input rather than a
 * real `TextInput`: typing here would need a second copy of the composer, and the assistant
 * screen already owns that. Tapping opens it — the design of that screen is unchanged.
 */
export function AskBar({ onPress }: { onPress: () => void }) {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ask the trip assistant"
        onPress={onPress}
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      >
        <Image
          source={require('../../../assets/trip_planner/ai_trip_planner_icon.png')}
          style={styles.orb}
          contentFit="cover"
        />
        <Text style={styles.placeholder}>Ask me here…</Text>
        <Ionicons name="arrow-forward-circle" size={26} color={colors.brand} />
      </Pressable>

      <View style={styles.hintRow}>
        <Ionicons name="sparkles" size={12} color={colors.brand} />
        <Text style={styles.hint}>Just type your dream destination, we&apos;ll handle the plan</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  pressed: { opacity: 0.8 },
  orb: { width: 34, height: 34, borderRadius: radii.pill },
  placeholder: { flex: 1, fontSize: fontSize.md, color: colors.textMuted },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  hint: { flex: 1, fontSize: fontSize.xs, color: colors.textMuted },
});
