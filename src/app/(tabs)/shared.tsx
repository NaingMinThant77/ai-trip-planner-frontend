import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../../api/client';
import { ErrorState, LoadingState } from '../../components/ui/screen-state';
import { useSharedWithMe } from '../../hooks/use-sharing';
import { formatTripRange } from '../../lib/trip-status';
import { initialsOf } from '../../components/profile/gradient-header';
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
    <View style={styles.screen}>
      <LinearGradient
        colors={['#DCEBFD', '#EAF3FE', colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
      >
        <View pointerEvents="none" style={styles.blobLarge} />
        <View pointerEvents="none" style={styles.blobSmall} />
        <Text style={styles.eyebrow}>SHARED WITH YOU</Text>
        <Text style={styles.title}>Shared trips</Text>
        <View style={styles.countPill}>
          <Ionicons name="people" size={13} color={jellyColors.sky} />
          <Text style={styles.countText}>
            {trips.length === 0
              ? 'Trips your members share appear here'
              : `${trips.length} ${trips.length === 1 ? 'trip' : 'trips'} shared with you`}
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={trips}
        keyExtractor={(trip) => trip.id}
        contentContainerStyle={[styles.list, trips.length === 0 && styles.listEmpty]}
        refreshing={shared.isRefetching}
        onRefresh={() => void shared.refetch()}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="paper-plane" size={34} color={jellyColors.sky} />
            </View>
            <Text style={styles.emptyTitle}>Nothing shared yet</Text>
            <Text style={styles.emptyBody}>
              When a member shares a trip with you, it will show up here so you can view or plan it together.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/family')}
              style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}
            >
              <Ionicons name="person-add-outline" size={16} color={colors.textInverse} />
              <Text style={styles.emptyCtaText}>Find members</Text>
            </Pressable>
          </View>
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
      <View style={[styles.ownerAvatar, isEditor && styles.ownerAvatarEditor]}>
        <Text style={[styles.ownerInitials, isEditor && styles.ownerInitialsEditor]}>
          {initialsOf(trip.ownerName)}
        </Text>
      </View>
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
  header: {
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
    right: -40,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(61,158,240,0.14)',
  },
  blobSmall: {
    position: 'absolute',
    bottom: -30,
    right: 100,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(18,184,134,0.14)',
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  countText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.text },
  listEmpty: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: layout.tabBarClearance, gap: spacing.sm },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: jellyColors.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  emptyBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.brand,
  },
  emptyCtaText: { color: colors.textInverse, fontWeight: '700', fontSize: fontSize.sm },
  ownerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: jellyColors.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarEditor: { backgroundColor: jellyColors.mintSoft },
  ownerInitials: { fontSize: fontSize.sm, fontWeight: '800', color: jellyColors.sky },
  ownerInitialsEditor: { color: jellyColors.mint },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: jellyColors.sky,
    letterSpacing: 1,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
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
