import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

/**
 * The rich card on Home: a photo banner with the status and title laid over it, then the
 * route, dates, notes and how far the planning has got.
 */
export function TripPlanCard({ trip, origin, onPress }: Props) {
  const days = tripDayCount(trip);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.banner}>
        <TripCover
          seed={trip.id}
          imageUrl={trip.coverImageUrl}
          label={trip.destination}
          style={styles.cover}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']}
          style={styles.scrim}
          pointerEvents="none"
        />

        <View style={styles.bannerTop}>
          <View style={styles.chipWrap}>
            <StatusChip phase={tripPhase(trip)} size="sm" />
          </View>
          <View style={styles.daysPill}>
            <Ionicons name="time-outline" size={12} color={colors.textInverse} />
            <Text style={styles.daysText}>
              {days} {days === 1 ? 'day' : 'days'}
            </Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {trip.title}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <View style={[styles.metaIcon, { backgroundColor: colors.brandSoft }]}>
            <Ionicons name="location" size={12} color={colors.brandDark} />
          </View>
          <Text style={styles.route} numberOfLines={1}>
            {origin ? `${origin}  →  ${trip.destination}` : trip.destination}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.metaIcon, { backgroundColor: colors.infoSoft }]}>
            <Ionicons name="calendar" size={12} color={colors.info} />
          </View>
          <Text style={styles.dates}>{formatTripRange(trip)}</Text>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  pressed: { opacity: 0.85 },
  banner: { height: 150, justifyContent: 'space-between', padding: spacing.md },
  cover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipWrap: { borderRadius: radii.pill, backgroundColor: colors.background },
  daysPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  daysText: { fontSize: 11, fontWeight: '700', color: colors.textInverse },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.2,
  },
  body: { padding: spacing.md, paddingTop: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  metaIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  route: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontWeight: '700' },
  dates: { fontSize: fontSize.sm, color: colors.textMuted },
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
  progressValue: { fontSize: fontSize.xs, fontWeight: '800', color: colors.brandDark },
});
