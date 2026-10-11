import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../../api/client';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/screen-state';
import { useSharedWithMe } from '../../hooks/use-sharing';
import { formatTripRange } from '../../lib/trip-status';
import { colors, fontSize, jellyColors, layout, radii, spacing } from '../../theme';
import { CollaboratorRole, SharedWithMeTrip } from '../../types/api';

const ROLE_LABEL: Record<CollaboratorRole, string> = { viewer: 'View', editor: 'Edit' };

/** "Shared with me" — trips someone else owns and shared via the family/invite-code flow,
 * as opposed to My trips which lists trips this account owns. */
export default function SharedTripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const shared = useSharedWithMe();
  const { refetch } = shared;

  // Tabs stay mounted, so without this the list is whatever it was the first time the tab was
  // seen — a trip shared a minute later would not appear until a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  if (shared.isPending) return <LoadingState label="Loading shared trips…" />;

  if (shared.isError) {
    return (
      <ErrorState
        message={shared.error instanceof ApiError ? shared.error.message : 'Could not load shared trips.'}
        onRetry={() => void shared.refetch()}
      />
    );
  }

  const trips = shared.data;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SHARED WITH YOU</Text>
        <Text style={styles.title}>Shared trips</Text>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(trip) => trip.id}
        contentContainerStyle={styles.list}
        refreshing={shared.isRefetching}
        onRefresh={() => void shared.refetch()}
        ListEmptyComponent={
          <EmptyState
            title="Nothing shared yet"
            message="No trips have been shared with you yet."
          />
        }
        renderItem={({ item }) => (
          <SharedTripCard trip={item} onPress={() => router.push(`/trip/${item.id}`)} />
        )}
      />
    </View>
  );
}

function SharedTripCard({ trip, onPress }: { trip: SharedWithMeTrip; onPress: () => void }) {
  const isEditor = trip.role === 'editor';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {trip.title}
          </Text>
          <View style={[styles.roleBadge, isEditor && styles.roleBadgeEditor]}>
            <Text style={[styles.roleBadgeLabel, isEditor && styles.roleBadgeLabelEditor]}>
              {ROLE_LABEL[trip.role]}
            </Text>
          </View>
        </View>

        <Text style={styles.cardDestination} numberOfLines={1}>
          {trip.destination}
        </Text>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.dates}>{formatTripRange(trip)}</Text>
        </View>

        <Text style={styles.owner}>Shared by {trip.ownerName}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: jellyColors.sky,
    letterSpacing: 1,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pressed: { opacity: 0.75 },
  cardBody: { flex: 1, gap: spacing.xs },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  cardDestination: { fontSize: fontSize.sm, color: colors.textMuted },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dates: { fontSize: fontSize.xs, color: colors.textMuted },
  owner: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic' },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: jellyColors.skySoft,
  },
  roleBadgeEditor: { backgroundColor: jellyColors.mintSoft },
  roleBadgeLabel: { fontSize: fontSize.xs, fontWeight: '700', color: jellyColors.sky },
  roleBadgeLabelEditor: { color: jellyColors.mint },
});
