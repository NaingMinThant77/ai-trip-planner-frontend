import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatTripRange, tripDayCount, tripPhase, TRIP_PHASE_LABEL } from '../../lib/trip-status';
import { colors, fontSize, radii, spacing } from '../../theme';
import { TripListItem } from '../../types/api';

type Props = {
  /** Active and upcoming trips (plus the selected one, whatever its phase). */
  trips: TripListItem[];
  /** Null means "new trip" mode. */
  selectedId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (tripId: string | null) => void;
  onOpenTrip: (tripId: string) => void;
};

/**
 * The dropdown under the chat header: which trip this conversation is about, or "create a new
 * trip from scratch". The open list floats over the thread rather than pushing it down.
 */
export function TripSelector({ trips, selectedId, isOpen, onToggle, onSelect, onOpenTrip }: Props) {
  const selected = selectedId ? trips.find((trip) => trip.id === selectedId) : null;
  const isNew = selectedId === null;

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose which trip to chat about"
        accessibilityState={{ expanded: isOpen }}
        onPress={onToggle}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={[styles.tile, isNew && styles.tileNew]}>
          <Ionicons
            name={isNew ? 'sparkles' : 'airplane'}
            size={18}
            color={isNew ? colors.accent : colors.brandDark}
          />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {isNew ? 'New trip' : (selected?.title ?? 'Loading trip…')}
          </Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {isNew
              ? 'Plan something from scratch'
              : selected
                ? `${formatTripRange(selected)} • ${tripDayCount(selected)} Days`
                : ' '}
          </Text>
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        {selected ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open this trip"
            hitSlop={8}
            onPress={() => onOpenTrip(selected.id)}
          >
            <Ionicons name="map-outline" size={22} color={colors.brand} />
          </Pressable>
        ) : null}
      </Pressable>

      {isOpen ? (
        <View style={styles.menu}>
          <ScrollView style={styles.menuScroll} keyboardShouldPersistTaps="handled">
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(null)}
              style={[styles.row, isNew && styles.rowSelected]}
            >
              <View style={[styles.rowIcon, styles.tileNew]}>
                <Ionicons name="add" size={18} color={colors.accent} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.rowTitle}>Create new trip</Text>
                <Text style={styles.cardSub}>Chat your way to a brand new plan</Text>
              </View>
              {isNew ? <Ionicons name="checkmark" size={18} color={colors.brand} /> : null}
            </Pressable>

            <Text style={styles.sectionLabel}>ACTIVE &amp; UPCOMING</Text>

            {trips.length === 0 ? (
              <Text style={styles.empty}>No active or upcoming trips yet.</Text>
            ) : (
              trips.map((trip) => (
                <Pressable
                  key={trip.id}
                  accessibilityRole="button"
                  onPress={() => onSelect(trip.id)}
                  style={[styles.row, trip.id === selectedId && styles.rowSelected]}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name="airplane" size={16} color={colors.brandDark} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {trip.title}
                    </Text>
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {trip.destination} • {formatTripRange(trip)}
                    </Text>
                  </View>
                  <Text style={styles.phase}>{TRIP_PHASE_LABEL[tripPhase(trip)]}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Above the thread so the open menu overlaps it instead of sitting underneath.
  wrap: { zIndex: 20, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pressed: { opacity: 0.85 },
  tile: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileNew: { backgroundColor: colors.accentSoft },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  menu: {
    position: 'absolute',
    top: '100%',
    left: spacing.lg,
    right: spacing.lg,
    marginTop: -spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  menuScroll: { maxHeight: 320 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowSelected: { backgroundColor: colors.brandSoft },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  empty: { fontSize: fontSize.sm, color: colors.textMuted, padding: spacing.md },
  phase: { fontSize: fontSize.xs, fontWeight: '600', color: colors.brandDark },
});
