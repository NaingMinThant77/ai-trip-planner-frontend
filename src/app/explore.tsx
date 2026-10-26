import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../api/client';
import { Chip } from '../components/ui/chip';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/screen-state';
import { TextField } from '../components/ui/text-field';
import { useDestinations, useRegions, useSuggestions } from '../hooks/use-explore';
import { colors, fontSize, radii, spacing } from '../theme';
import { Destination } from '../types/api';

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ region?: string }>();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState(params.region ?? '');

  const regions = useRegions();
  const destinations = useDestinations(query, region);
  const suggestions = useSuggestions();

  const isFiltering = query.trim().length > 0 || region.length > 0;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TextField
          label="Search"
          value={query}
          onChangeText={setQuery}
          placeholder="Country, city, or what you fancy"
          autoCapitalize="none"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip label="All" isSelected={region === ''} onPress={() => setRegion('')} />
          {(regions.data ?? []).map((name) => (
            <Chip
              key={name}
              label={name}
              isSelected={region === name}
              onPress={() => setRegion(region === name ? '' : name)}
            />
          ))}
        </ScrollView>
      </View>

      {destinations.isPending ? (
        <LoadingState label="Loading destinations…" />
      ) : destinations.isError ? (
        <ErrorState
          message={
            destinations.error instanceof ApiError
              ? destinations.error.message
              : 'Could not load destinations.'
          }
          onRetry={() => void destinations.refetch()}
        />
      ) : destinations.data.length === 0 ? (
        <EmptyState
          title="Nothing matched"
          message="Try a different search or clear the region filter."
        />
      ) : (
        <FlatList
          data={destinations.data}
          keyExtractor={(destination) => destination.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            // Personalised picks only make sense on the unfiltered view.
            !isFiltering && (suggestions.data?.length ?? 0) > 0 ? (
              <Text style={styles.sectionTitle}>Picked for you</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <DestinationCard
              destination={item}
              reason={
                !isFiltering
                  ? suggestions.data?.find((s) => s.id === item.id)?.reason ?? null
                  : null
              }
              onPress={() => router.push(`/destination/${item.slug}`)}
            />
          )}
        />
      )}
    </View>
  );
}

function DestinationCard({
  destination,
  reason,
  onPress,
}: {
  destination: Destination;
  reason: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{destination.name}</Text>
        <Text style={styles.country}>{destination.country}</Text>
      </View>

      <Text style={styles.summary}>{destination.summary}</Text>

      {reason ? <Text style={styles.reason}>{reason}</Text> : null}

      <View style={styles.tags}>
        {destination.tags.slice(0, 4).map((tag) => (
          <Chip key={tag} label={tag} />
        ))}
      </View>

      {destination.dailyBudgetText ? (
        <Text style={styles.budget}>{destination.dailyBudgetText}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { padding: spacing.lg, paddingBottom: 0, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  country: { fontSize: fontSize.xs, color: colors.textMuted },
  summary: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  reason: {
    fontSize: fontSize.xs,
    color: colors.primaryDark,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  budget: { fontSize: fontSize.xs, color: colors.textMuted },
});
