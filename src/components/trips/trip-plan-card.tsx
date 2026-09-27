import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatTripRange, tripDayCount, tripPhase } from '../../lib/trip-status';
import { colors, fontSize, radii, spacing } from '../../theme';
import { TripListItem } from '../../types/api';
import { ProgressBar } from '../ui/progress-bar';
import { StatusChip } from '../ui/status-chip';
import { TripCover } from './trip-cover';

type Props = {
  trip: TripListItem;
  /** The traveller's home city, shown as the origin. Omitted when they have not set one. */
  origin?: string | null;
  onPress: () => void;
};

/** The rich card on Home: route, dates, notes and how far the planning has got. */
export function TripPlanCard({ trip, origin, onPress }: Props) {
  const days = tripDayCount(trip);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {trip.title}
          </Text>
          <StatusChip phase={tripPhase(trip)} size="sm" />
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.brandDark} />
          <Text style={styles.route} numberOfLines={1}>
            {origin ? `${origin}  →  ${trip.destination}` : trip.destination}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={styles.dates}>
            {formatTripRange(trip)} · {days} {days === 1 ? 'day' : 'days'} trip
          </Text>
        </View>

        {trip.notes ? (
          <Text style={styles.notes} numberOfLines={2}>
            {trip.notes}
          </Text>
        ) : null}

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Planning progress</Text>
          <Text style={styles.progressValue}>{trip.planning.progress}%</Text>
        </View>
        <ProgressBar value={trip.planning.progress} />
      </View>

      <TripCover
        seed={trip.id}
        imageUrl={trip.coverImageUrl}
        label={trip.destination}
        style={styles.cover}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    // Soft lift, matching the floating tab bar rather than the old hairline borders.
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pressed: { opacity: 0.75 },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.xs },
  route: { flex: 1, fontSize: fontSize.xs, color: colors.text, fontWeight: '600' },
  dates: { fontSize: fontSize.xs, color: colors.textMuted },
  notes: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 17,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  progressLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  progressValue: { fontSize: fontSize.xs, fontWeight: '700', color: colors.brandDark },
  cover: { width: 96, borderRadius: radii.md, alignSelf: 'stretch', minHeight: 120 },
});
