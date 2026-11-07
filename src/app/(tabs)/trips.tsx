import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../../api/client';
import { TripRowCard } from '../../components/trips/trip-row-card';
import { confirmAction } from '../../components/ui/confirm-host';
import { ErrorState, LoadingState } from '../../components/ui/screen-state';
import { TripPhase, tripPhase } from '../../lib/trip-status';
import { useDeleteTrip, useTrips } from '../../hooks/use-trips';
import { colors, fontSize, jellyColors, layout, radii, spacing } from '../../theme';
import { TripListItem } from '../../types/api';

export default function MyTripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useTrips();
  const deleteTrip = useDeleteTrip();

  if (trips.isPending) return <LoadingState label="Loading your trips…" />;

  if (trips.isError) {
    return (
      <ErrorState
        message={trips.error instanceof ApiError ? trips.error.message : 'Could not load trips.'}
        onRetry={() => void trips.refetch()}
      />
    );
  }

  // Soonest first among live trips, then everything already finished, newest first — a
  // completed trip from last year should not sit above next week's.
  const ordered = [...trips.data].sort((a, b) => {
    const byPhase = phaseRank(a) - phaseRank(b);
    if (byPhase !== 0) return byPhase;
    return phaseRank(a) === 2
      ? b.startDate.localeCompare(a.startDate)
      : a.startDate.localeCompare(b.startDate);
  });

  function confirmDelete(trip: TripListItem): void {
    confirmAction({
      title: `Delete "${trip.title}"?`,
      message: 'This permanently removes the trip with its itinerary, packing list, bookings and photos.',
      confirmLabel: 'Delete trip',
      onConfirm: () =>
        deleteTrip.mutate(trip.id, {
          onError: (caught) =>
            Alert.alert(
              'Could not delete',
              caught instanceof ApiError ? caught.message : 'Please try again.',
            ),
        }),
    });
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FFE9D6', '#FFF3EA', colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
      >
        <View pointerEvents="none" style={styles.blobLarge} />
        <View pointerEvents="none" style={styles.blobSmall} />
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>SAVED PLANS</Text>
          <Text style={styles.title}>My trips</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Plan a new trip"
          onPress={() => router.push('/new-trip')}
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={26} color={colors.textInverse} />
        </Pressable>
      </LinearGradient>

      <FlatList
        data={ordered}
        keyExtractor={(trip) => trip.id}
        contentContainerStyle={styles.list}
        refreshing={trips.isRefetching}
        onRefresh={() => void trips.refetch()}
        ListHeaderComponent={<SummaryBanner trips={ordered} />}
        ListEmptyComponent={
          <Pressable
            accessibilityRole="button"
            style={styles.emptyCard}
            onPress={() => router.push('/new-trip')}
          >
            <Ionicons name="map-outline" size={28} color={colors.brand} />
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptyBody}>
              Plan your first one and it will be saved here.
            </Text>
          </Pressable>
        }
        renderItem={({ item }) => (
          <TripRowCard
            trip={item}
            onPress={() => router.push(`/trip/${item.id}`)}
            onEdit={() => router.push({ pathname: '/edit-trip', params: { id: item.id } })}
            onDelete={() => confirmDelete(item)}
          />
        )}
      />
    </View>
  );
}

/**
 * Counts by phase rather than "shared": trips shared *with* the signed-in user are not a thing
 * the API returns yet, so a Shared tile would always read 0 and mean nothing.
 */
function SummaryBanner({ trips }: { trips: TripListItem[] }) {
  const counts: Record<TripPhase, number> = { upcoming: 0, ongoing: 0, completed: 0 };
  for (const trip of trips) {
    counts[tripPhase(trip)] += 1;
  }

  return (
    <View style={styles.banner}>
      <View style={styles.bannerTop}>
        <Text style={styles.bannerCount}>
          {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
        </Text>
        <Text style={styles.bannerBody}>
          {trips.length === 0
            ? 'Your saved plans will appear here.'
            : 'Every plan you have saved, soonest first.'}
        </Text>
      </View>

      <View style={styles.bannerStats}>
        <Stat value={counts.upcoming} label="Upcoming" icon="airplane" tint={jellyColors.sky} soft={jellyColors.skySoft} />
        <Stat value={counts.ongoing} label="Ongoing" icon="navigate" tint={jellyColors.mint} soft={jellyColors.mintSoft} />
        <Stat value={counts.completed} label="Completed" icon="checkmark-done" tint={colors.textMuted} soft={colors.surfaceAlt} />
      </View>
    </View>
  );
}

function Stat({
  value,
  label,
  icon,
  tint,
  soft,
}: {
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  soft: string;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: soft }]}>
      <View style={[styles.statIcon, { backgroundColor: colors.background }]}>
        <Ionicons name={icon} size={14} color={tint} />
      </View>
      <Text style={[styles.statValue, { color: tint }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function phaseRank(trip: TripListItem): number {
  const phase = tripPhase(trip);
  if (phase === 'ongoing') return 0;
  if (phase === 'upcoming') return 1;
  return 2;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    marginBottom: spacing.lg,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: 'hidden',
  },
  blobLarge: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(224,122,63,0.14)',
  },
  blobSmall: {
    position: 'absolute',
    bottom: -30,
    right: 120,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(14,138,125,0.12)',
  },
  headerText: { flex: 1 },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  add: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  pressed: { opacity: 0.8 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance },
  banner: { marginBottom: spacing.lg, gap: spacing.md },
  bannerTop: { gap: 2 },
  bannerCount: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  bannerBody: { fontSize: fontSize.xs, color: colors.textMuted },
  bannerStats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: fontSize.xl, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  emptyCard: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
});
