import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatTripRange, tripDayCount, tripPhase } from '../../lib/trip-status';
import { colors, fontSize, radii, spacing } from '../../theme';
import { Trip } from '../../types/api';
import { StatusChip } from '../ui/status-chip';
import { MenuAnchor, TripActionsMenu } from './trip-actions-menu';
import { TripCover } from './trip-cover';

type Props = {
  trip: Trip;
  /** Tapping the card itself is the same as "View". */
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/** The compact row on My trips: thumbnail, title, dates, phase, and a "⋮" actions menu. */
export function TripRowCard({ trip, onPress, onEdit, onDelete }: Props) {
  const menuButton = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);

  function openMenu(): void {
    // Measured at press time: the list scrolls, so a stored position would go stale.
    menuButton.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
  }

  const days = tripDayCount(trip);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
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
          <Ionicons name="location-outline" size={12} color={colors.brand} />
          <Text style={styles.destination} numberOfLines={1}>
            {trip.destination}
          </Text>
        </View>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.dates}>{formatTripRange(trip)}</Text>
        </View>
        <View style={styles.chips}>
          <StatusChip phase={tripPhase(trip)} size="sm" />
          <View style={styles.daysChip}>
            <Text style={styles.daysText}>
              {days} {days === 1 ? 'day' : 'days'}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        ref={menuButton}
        accessibilityRole="button"
        accessibilityLabel={`Actions for ${trip.title}`}
        hitSlop={8}
        onPress={openMenu}
        style={({ pressed }) => [styles.menuButton, pressed && styles.menuPressed]}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
      </Pressable>

      <TripActionsMenu
        anchor={anchor}
        onClose={() => setAnchor(null)}
        onView={onPress}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pressed: { opacity: 0.75 },
  menuButton: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuPressed: { backgroundColor: colors.surfaceAlt },
  chips: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  daysChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
  },
  daysText: { fontSize: 10, fontWeight: '700', color: colors.accent },
  cover: { width: 84, height: 84, borderRadius: radii.lg },
  body: { flex: 1, gap: spacing.xs },
  title: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  destination: { flex: 1, fontSize: fontSize.xs, fontWeight: '600', color: colors.brandDark },
  dates: { fontSize: fontSize.xs, color: colors.textMuted },
});
