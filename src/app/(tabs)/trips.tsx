import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { ApiError } from '../../api/client';
import { TripCard } from '../../components/trip-card';
import { Button } from '../../components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/screen-state';
import { useTrips } from '../../hooks/use-trips';
import { layout, spacing } from '../../theme';

export default function MyTripsScreen() {
  const router = useRouter();
  const trips = useTrips();

  if (trips.isPending) return <LoadingState label="Loading your trips…" />;

  if (trips.isError) {
    return (
      <ErrorState
        message={trips.error instanceof ApiError ? trips.error.message : 'Could not load trips.'}
        onRetry={() => void trips.refetch()}
      />
    );
  }

  if (trips.data.length === 0) {
    return (
      <EmptyState
        title="No trips yet"
        message="Plan your first trip and it will show up here."
        actionLabel="Plan a trip"
        onAction={() => router.push('/new-trip')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trips.data}
        keyExtractor={(trip) => trip.id}
        contentContainerStyle={styles.list}
        refreshing={trips.isRefetching}
        onRefresh={() => void trips.refetch()}
        renderItem={({ item }) => (
          <TripCard trip={item} onPress={() => router.push(`/trip/${item.id}`)} />
        )}
      />

      <View style={styles.footer}>
        <Button label="Plan a new trip" onPress={() => router.push('/new-trip')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.lg, paddingBottom: layout.tabBarClearance },
  footer: { padding: spacing.lg, paddingTop: 0 },
});
