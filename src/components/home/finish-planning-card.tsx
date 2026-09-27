import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';
import { TripListItem } from '../../types/api';
import { ProgressBar } from '../ui/progress-bar';

type Props = {
  trip: TripListItem;
  /** What is actually missing, phrased by `nextPlanningStep`. */
  nextStep: string;
  onContinue: () => void;
  onAskAi: () => void;
};

/** The nudge for the trip closest to departure that still has gaps. */
export function FinishPlanningCard({ trip, nextStep, onContinue, onAskAi }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.tile}>
          <Ionicons name="create-outline" size={18} color={colors.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {trip.title}
          </Text>
          <Text style={styles.body}>{nextStep}</Text>
        </View>
        <Text style={styles.progress}>{trip.planning.progress}%</Text>
      </View>

      <View style={styles.bar}>
        <ProgressBar value={trip.planning.progress} color={colors.accent} />
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onContinue}
          style={({ pressed }) => [styles.continue, pressed && styles.pressed]}
        >
          <Text style={styles.continueLabel}>Continue</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.textInverse} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onAskAi}
          style={({ pressed }) => [styles.ask, pressed && styles.pressed]}
        >
          <Ionicons name="sparkles" size={14} color={colors.brandDark} />
          <Text style={styles.askLabel}>Ask AI</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  tile: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  body: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  progress: { fontSize: fontSize.sm, fontWeight: '700', color: colors.accent },
  bar: { marginTop: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  continue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 46,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  continueLabel: { color: colors.textInverse, fontSize: fontSize.sm, fontWeight: '700' },
  ask: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 46,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
  },
  askLabel: { color: colors.brandDark, fontSize: fontSize.sm, fontWeight: '700' },
  pressed: { opacity: 0.8 },
});
