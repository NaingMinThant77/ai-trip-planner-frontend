import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatTripRange, tripPhase } from '../../lib/trip-status';
import { colors, fontSize, radii, spacing, tripCoverGradient } from '../../theme';
import { Trip } from '../../types/api';
import { StatusChip } from '../ui/status-chip';
import { TripCover } from './trip-cover';

/** The compact row on My trips: thumbnail, title, dates, phase. */
export function TripRowCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  // The accent stripe reuses the cover's own colour so the two read as one card.
  const [accent] = tripCoverGradient(trip.id);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.accent, { backgroundColor: accent }]} />

      <TripCover
        seed={trip.id}
        imageUrl={trip.coverImageUrl}
        label={trip.destination}
        style={styles.cover}
      />

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {trip.title}
        </Text>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.dates}>{formatTripRange(trip)}</Text>
        </View>
        <StatusChip phase={tripPhase(trip)} size="sm" />
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pressed: { opacity: 0.75 },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  cover: { width: 62, height: 62, borderRadius: radii.md },
  body: { flex: 1, gap: spacing.xs },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dates: { fontSize: fontSize.xs, color: colors.textMuted },
});
