import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';
import { TripListItem } from '../../types/api';

type Props = {
  trip: TripListItem;
  /** What is actually missing, phrased by `nextPlanningStep`. */
  nextStep: string;
  onContinue: () => void;
  onAskAi: () => void;
};

/** The nudge for the trip closest to departure that still has gaps. */
export function FinishPlanningCard({ trip, nextStep, onContinue, onAskAi }: Props) {
  const progress = Math.max(0, Math.min(100, trip.planning.progress));

  return (
    <LinearGradient
      colors={['#F59A5B', '#E07A3F', '#D4622A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View pointerEvents="none" style={styles.blob} />

      <View style={styles.header}>
        <View style={styles.tile}>
          <Ionicons name="rocket" size={18} color={colors.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {trip.title}
          </Text>
          <Text style={styles.body}>{nextStep}</Text>
        </View>
      </View>

      <View style={styles.barRow}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progress}>{progress}%</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onContinue}
          style={({ pressed }) => [styles.continue, pressed && styles.pressed]}
        >
          <Text style={styles.continueLabel}>Continue</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.accent} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onAskAi}
          style={({ pressed }) => [styles.ask, pressed && styles.pressed]}
        >
          <Ionicons name="sparkles" size={14} color={colors.textInverse} />
          <Text style={styles.askLabel}>Ask AI</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  blob: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  tile: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: fontSize.md, fontWeight: '800', color: colors.textInverse },
  body: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.9)', marginTop: 2, lineHeight: 17 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.textInverse },
  progress: { fontSize: fontSize.sm, fontWeight: '800', color: colors.textInverse },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  continue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 46,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
  },
  continueLabel: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '800' },
  ask: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 46,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  askLabel: { color: colors.textInverse, fontSize: fontSize.sm, fontWeight: '800' },
  pressed: { opacity: 0.8 },
});
