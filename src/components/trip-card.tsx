import { Pressable, StyleSheet, Text, View } from 'react-native';
import { budgetTierLabel, colors, fontSize, radii, spacing } from '../theme';
import { Trip } from '../types/api';

const STATUS_LABEL: Record<Trip['status'], string> = {
  draft: 'No itinerary yet',
  generating: 'Planning…',
  ready: 'Itinerary ready',
  failed: 'Planning failed',
};

const STATUS_COLOR: Record<Trip['status'], string> = {
  draft: colors.textMuted,
  generating: colors.warning,
  ready: colors.success,
  failed: colors.danger,
};

export function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {trip.title}
        </Text>
        <Text style={styles.nights}>{nightsLabel(trip.startDate, trip.endDate)}</Text>
      </View>

      <Text style={styles.destination}>{trip.destination}</Text>
      <Text style={styles.dates}>{formatRange(trip.startDate, trip.endDate)}</Text>

      <View style={styles.footer}>
        <Text style={[styles.status, { color: STATUS_COLOR[trip.status] }]}>
          {STATUS_LABEL[trip.status]}
        </Text>
        <Text style={styles.meta}>
          {trip.travelers} {trip.travelers === 1 ? 'traveller' : 'travellers'} ·{' '}
          {budgetTierLabel[trip.budgetTier]}
        </Text>
      </View>
    </Pressable>
  );
}

function nightsLabel(start: string, end: string): string {
  const nights = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000,
  );
  return nights === 1 ? '1 night' : `${nights} nights`;
}

function formatRange(start: string, end: string): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const from = new Date(start).toLocaleDateString(undefined, options);
  const to = new Date(end).toLocaleDateString(undefined, { ...options, year: 'numeric' });
  return `${from} – ${to}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.7 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  nights: { fontSize: fontSize.xs, color: colors.textMuted },
  destination: { fontSize: fontSize.sm, color: colors.primaryDark, marginTop: 2 },
  dates: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  status: { fontSize: fontSize.xs, fontWeight: '600' },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
});
