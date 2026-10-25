import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatTripRange, tripPhase } from '../../lib/trip-status';
import { colors, fontSize, radii, spacing, tripCoverGradient } from '../../theme';
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
  menuButton: { padding: spacing.xs, borderRadius: radii.pill },
  menuPressed: { backgroundColor: colors.surface },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  cover: { width: 62, height: 62, borderRadius: radii.md },
  body: { flex: 1, gap: spacing.xs },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dates: { fontSize: fontSize.xs, color: colors.textMuted },
});
