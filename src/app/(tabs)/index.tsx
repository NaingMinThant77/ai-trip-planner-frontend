import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../api/client';
import { TripCard } from '../../components/trip-card';
import { ErrorState, LoadingState } from '../../components/ui/screen-state';
import { useAuth } from '../../context/auth';
import { useSuggestions } from '../../hooks/use-explore';
import { useTrips } from '../../hooks/use-trips';
import { colors, fontSize, layout, radii, spacing } from '../../theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const trips = useTrips();
  const suggestions = useSuggestions();

  const upcoming = (trips.data ?? [])
    .filter((trip) => new Date(trip.endDate) >= new Date())
    .slice(0, 2);

  if (trips.isPending) return <LoadingState label="Loading your trips…" />;

  if (trips.isError) {
    return (
      <ErrorState
        message={trips.error instanceof ApiError ? trips.error.message : 'Could not load trips.'}
        onRetry={() => void trips.refetch()}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hello{user ? `, ${user.name.split(' ')[0]}` : ''}</Text>
      <Text style={styles.subtitle}>Where are you headed next?</Text>

      <View style={styles.actions}>
        <ActionTile
          icon="add-circle"
          label="New trip"
          onPress={() => router.push('/new-trip')}
        />
        <ActionTile
          icon="sparkles"
          label="Ask the assistant"
          onPress={() => router.push('/agent')}
        />
        <ActionTile icon="compass" label="Explore" onPress={() => router.push('/explore')} />
      </View>

      <Text style={styles.sectionTitle}>Upcoming</Text>
      {upcoming.length === 0 ? (
        <Pressable style={styles.emptyCard} onPress={() => router.push('/new-trip')}>
          <Text style={styles.emptyTitle}>No upcoming trips</Text>
          <Text style={styles.emptyBody}>Tap to plan your first one.</Text>
        </Pressable>
      ) : (
        upcoming.map((trip) => (
          <TripCard key={trip.id} trip={trip} onPress={() => router.push(`/trip/${trip.id}`)} />
        ))
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Suggested for you</Text>
        <Pressable onPress={() => router.push('/explore')}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      {suggestions.isPending ? (
        <Text style={styles.hint}>Finding places you might like…</Text>
      ) : suggestions.isError ? (
        <Text style={styles.hint}>Suggestions are unavailable right now.</Text>
      ) : suggestions.data.length === 0 ? (
        <Text style={styles.hint}>
          Add a few interests in your profile and suggestions will show up here.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {suggestions.data.slice(0, 6).map((suggestion) => (
            <Pressable
              key={suggestion.id}
              style={styles.suggestion}
              onPress={() => router.push('/explore')}
            >
              <Text style={styles.suggestionName}>{suggestion.name}</Text>
              <Text style={styles.suggestionCountry}>{suggestion.country}</Text>
              <Text style={styles.suggestionReason} numberOfLines={3}>
                {suggestion.reason}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </ScrollView>
  );
}

function ActionTile({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <Ionicons name={icon} size={24} color={colors.primary} />
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: layout.tabBarClearance },
  greeting: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  tile: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  tilePressed: { opacity: 0.7 },
  tileLabel: { fontSize: fontSize.xs, color: colors.text, fontWeight: '600', textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  seeAll: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600', marginTop: spacing.md },
  emptyCard: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  hint: { fontSize: fontSize.sm, color: colors.textMuted },
  carousel: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  suggestion: {
    width: 200,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginRight: spacing.sm,
  },
  suggestionName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  suggestionCountry: { fontSize: fontSize.xs, color: colors.primaryDark, marginTop: 1 },
  suggestionReason: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 17,
  },
});
