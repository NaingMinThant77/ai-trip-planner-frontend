import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../../api/client';
import { AskBar } from '../../components/home/ask-bar';
import { ExploreSections } from '../../components/home/explore-sections';
import { FinishPlanningCard } from '../../components/home/finish-planning-card';
import { QuickTool, QuickTools } from '../../components/home/quick-tools';
import { Segmented } from '../../components/home/segmented';
import { TravelTips } from '../../components/home/travel-tips';
import { initialsOf } from '../../components/profile/gradient-header';
import { TripPlanCard } from '../../components/trips/trip-plan-card';
import { ErrorState, LoadingState } from '../../components/ui/screen-state';
import { useAuth } from '../../context/auth';
import { nextPlanningStep, tripNeedingAttention, tripPhase } from '../../lib/trip-status';
import { useDestinations, useProfile, useSuggestions, useTrending } from '../../hooks/use-explore';
import { useTrips } from '../../hooks/use-trips';
import { colors, fontSize, layout, radii, spacing } from '../../theme';

type HomeTab = 'plan' | 'explore';

/** Trips already gone by are still reachable from My trips; Home leads with what is live. */
const PLAN_LIMIT = 3;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const trips = useTrips();
  const profile = useProfile();
  const suggestions = useSuggestions();
  const destinations = useDestinations('', '');
  const trending = useTrending();
  const [tab, setTab] = useState<HomeTab>('plan');

  if (trips.isPending) return <LoadingState label="Loading your trips…" />;

  if (trips.isError) {
    return (
      <ErrorState
        message={trips.error instanceof ApiError ? trips.error.message : 'Could not load trips.'}
        onRetry={() => void trips.refetch()}
      />
    );
  }

  const allTrips = trips.data;
  // Live trips first, and only then the ones already finished.
  const planTrips = [...allTrips]
    .sort((a, b) => rank(a) - rank(b) || a.startDate.localeCompare(b.startDate))
    .slice(0, PLAN_LIMIT);

  const attention = tripNeedingAttention(allTrips);
  const attentionStep = attention ? nextPlanningStep(attention) : null;
  const displayName = user?.name ?? profile.data?.name ?? '';
  // The profile query is the fresher source: it updates right after a photo upload.
  const firstName = displayName.trim().split(/\s+/)[0] ?? '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const avatarUrl = profile.data?.avatarUrl ?? user?.avatarUrl ?? null;

  const quickTools: QuickTool[] = [
    {
      key: 'ai',
      icon: 'chatbubble-ellipses-outline',
      label: 'Plan with AI',
      background: colors.brandSoft,
      iconColor: colors.brandDark,
      onPress: () => router.push('/agent'),
    },
    {
      key: 'create',
      icon: 'add',
      label: 'Create trip',
      background: colors.accentSoft,
      iconColor: colors.accent,
      onPress: () => router.push('/new-trip'),
    },
    {
      key: 'trips',
      icon: 'briefcase-outline',
      label: 'My trips',
      background: colors.infoSoft,
      iconColor: colors.info,
      onPress: () => router.push('/(tabs)/trips'),
    },
    {
      key: 'family',
      icon: 'people-outline',
      label: 'Invite members',
      background: colors.primarySoft,
      iconColor: colors.primary,
      onPress: () => router.push('/(tabs)/family'),
    },
  ];

  function openAssistant(): void {
    // The assistant screen owns the conversation; Home only opens it. A tip does not arrive
    // as a pre-filled message — the composer there belongs to the user, not to this screen.
    router.push('/agent');
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <LinearGradient
        colors={['#CFF1E9', '#E8F7F3', colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
      >
        <View pointerEvents="none" style={styles.heroBlobLarge} />
        <View pointerEvents="none" style={styles.heroBlobSmall} />

        <View style={styles.header}>
          <View style={styles.greetingBlock}>
            <Text style={styles.hello}>{greeting}{firstName ? `, ${firstName}` : ''} 👋</Text>
            <Text style={styles.greeting}>
              Let&apos;s plan your next{'\n'}adventures <Text style={styles.greetingMark}>!</Text>
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Your profile"
            onPress={() => router.push('/(tabs)/profile')}
            style={({ pressed }) => [styles.avatarRing, pressed && styles.pressed]}
          >
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" transition={150} />
              ) : (
                <Text style={styles.avatarText}>{displayName ? initialsOf(displayName) : '?'}</Text>
              )}
            </View>
          </Pressable>
        </View>

        <AskBar onPress={() => openAssistant()} />
      </LinearGradient>

      <View style={styles.body}>
      <View style={styles.tabsRow}>
        <Segmented
          options={[
            { value: 'plan', label: 'My Plan' },
            { value: 'explore', label: 'Explore' },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === 'plan' && allTrips.length > PLAN_LIMIT ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/trips')}>
            <Text style={styles.allPlans}>All plans ({allTrips.length})</Text>
          </Pressable>
        ) : null}
      </View>

      {tab === 'plan' ? (
        <View>
          {planTrips.length === 0 ? (
            <Pressable
              accessibilityRole="button"
              style={styles.emptyCard}
              onPress={() => router.push('/new-trip')}
            >
              <Ionicons name="map-outline" size={26} color={colors.brand} />
              <Text style={styles.emptyTitle}>No plans yet</Text>
              <Text style={styles.emptyBody}>Create your first trip and it shows up here.</Text>
            </Pressable>
          ) : (
            planTrips.map((trip) => (
              <TripPlanCard
                key={trip.id}
                trip={trip}
                origin={profile.data?.homeCity ?? null}
                onPress={() => router.push(`/trip/${trip.id}`)}
              />
            ))
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/new-trip')}
            style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={18} color={colors.brandDark} />
            <Text style={styles.createLabel}>Create new trip plan</Text>
          </Pressable>
        </View>
      ) : (
        renderExplore()
      )}

      {tab === 'plan' ? (
        <View>
          <Text style={styles.sectionTitle}>Quick tools</Text>
          <QuickTools tools={quickTools} />

          {attention && attentionStep ? (
            <View>
              <Text style={styles.sectionTitle}>Finish planning</Text>
              <FinishPlanningCard
                trip={attention}
                nextStep={attentionStep}
                onContinue={() => router.push(`/trip/${attention.id}`)}
                onAskAi={() =>
                  router.push({ pathname: '/agent', params: { tripId: attention.id } })
                }
              />
            </View>
          ) : null}

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.sectionTitleFlush]}>Travel tips</Text>
            <Ionicons name="bulb-outline" size={16} color={colors.accent} />
          </View>
          <TravelTips onAsk={() => openAssistant()} />
        </View>
      ) : null}
      </View>
    </ScrollView>
  );

  /** Search, trending, best time to go, interests, regions, picks — then the full catalogue. */
  function renderExplore() {
    if (suggestions.isPending || destinations.isPending || trending.isPending) {
      return <Text style={styles.hint}>Finding places you might like…</Text>;
    }
    if (suggestions.isError && destinations.isError && trending.isError) {
      return <Text style={styles.hint}>Destinations are unavailable right now.</Text>;
    }

    const month = new Date().getMonth() + 1;
    const inSeason = (destinations.data ?? []).filter((d) => d.bestMonths.includes(month));

    return (
      <View>
        <ExploreSections
          picks={(suggestions.data ?? []).slice(0, 6)}
          inSeason={inSeason.slice(0, 8)}
          trending={trending.data ?? []}
          destinations={destinations.data ?? []}
          onSearch={() => router.push('/explore')}
          onRegion={(region) => router.push({ pathname: '/explore', params: { region } })}
          onOpen={(destination) => router.push(`/destination/${destination.slug}`)}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/explore')}
          style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
        >
          <Ionicons name="compass-outline" size={18} color={colors.brandDark} />
          <Text style={styles.createLabel}>Browse all destinations</Text>
        </Pressable>
      </View>
    );
  }
}

/** Ongoing first, then upcoming, then completed. */
function rank(trip: { startDate: string; endDate: string }): number {
  const phase = tripPhase(trip);
  if (phase === 'ongoing') return 0;
  if (phase === 'upcoming') return 1;
  return 2;
}

const styles = StyleSheet.create({
  content: { paddingBottom: layout.tabBarClearance },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  heroBlobLarge: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(14,138,125,0.12)',
  },
  heroBlobSmall: {
    position: 'absolute',
    bottom: 20,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(224,122,63,0.12)',
  },
  body: { paddingHorizontal: spacing.lg },
  greetingBlock: { flex: 1 },
  hello: { fontSize: fontSize.sm, fontWeight: '600', color: colors.brandDark, marginBottom: 2 },
  avatarRing: {
    padding: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    shadowColor: '#0B5F58',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  greeting: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  greetingMark: { color: colors.brand },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDark },
  pressed: { opacity: 0.75 },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  allPlans: { fontSize: fontSize.xs, fontWeight: '700', color: colors.brandDark },
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 54,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
    marginTop: spacing.xs,
  },
  createLabel: { fontSize: fontSize.sm, fontWeight: '800', color: colors.brandDark },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitleFlush: { marginTop: 0, marginBottom: 0 },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  hint: { fontSize: fontSize.sm, color: colors.textMuted },
});
