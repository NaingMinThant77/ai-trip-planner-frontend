import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../api/client';
import { BookingsSection } from '../../components/trip-sections/bookings-section';
import { ItinerarySection } from '../../components/trip-sections/itinerary-section';
import { MapSection } from '../../components/trip-sections/map-section';
import { PackingSection } from '../../components/trip-sections/packing-section';
import { PhotosSection } from '../../components/trip-sections/photos-section';
import { ShareSection } from '../../components/trip-sections/share-section';
import { ErrorState, LoadingState } from '../../components/ui/screen-state';
import { useDeleteTrip, useTrip } from '../../hooks/use-trips';
import { budgetTierLabel, colors, fontSize, radii, spacing } from '../../theme';

const SECTIONS = [
  { key: 'itinerary', label: 'Plan' },
  { key: 'map', label: 'Map' },
  { key: 'packing', label: 'Packing' },
  { key: 'photos', label: 'Photos' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'share', label: 'Share' },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = id ?? '';
  const router = useRouter();

  const trip = useTrip(tripId);
  const deleteTrip = useDeleteTrip();
  const [section, setSection] = useState<SectionKey>('itinerary');

  if (trip.isPending) return <LoadingState label="Loading trip…" />;

  if (trip.isError) {
    return (
      <ErrorState
        message={trip.error instanceof ApiError ? trip.error.message : 'Could not load this trip.'}
        onRetry={() => void trip.refetch()}
      />
    );
  }

  function confirmDelete(): void {
    Alert.alert('Delete trip', 'This removes the itinerary, packing list and photos.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteTrip.mutate(tripId, {
            onSuccess: () => router.replace('/(tabs)/trips'),
            onError: (error) =>
              Alert.alert(
                'Could not delete',
                error instanceof ApiError ? error.message : 'Please try again.',
              ),
          }),
      },
    ]);
  }

  const data = trip.data;

  return (
    <>
      <Stack.Screen
        options={{
          title: data.destination,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ask the assistant about this trip"
              onPress={() => router.push(`/agent?tripId=${tripId}`)}
              hitSlop={8}
            >
              <Ionicons name="sparkles" size={22} color={colors.primary} />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content} stickyHeaderIndices={[1]}>
        <View style={styles.header}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.dates}>
            {formatRange(data.startDate, data.endDate)} · {data.travelers}{' '}
            {data.travelers === 1 ? 'traveller' : 'travellers'} · {budgetTierLabel[data.budgetTier]}
          </Text>
          {data.notes ? <Text style={styles.notes}>{data.notes}</Text> : null}
        </View>

        <View style={styles.tabsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SECTIONS.map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: section === item.key }}
                onPress={() => setSection(item.key)}
                style={[styles.tab, section === item.key && styles.tabActive]}
              >
                <Text style={[styles.tabLabel, section === item.key && styles.tabLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          {section === 'itinerary' ? <ItinerarySection trip={data} /> : null}
          {section === 'map' ? <MapSection trip={data} /> : null}
          {section === 'packing' ? <PackingSection tripId={tripId} /> : null}
          {section === 'photos' ? <PhotosSection tripId={tripId} /> : null}
          {section === 'bookings' ? <BookingsSection tripId={tripId} /> : null}
          {section === 'share' ? <ShareSection tripId={tripId} tripTitle={data.title} /> : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={confirmDelete}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteLabel}>Delete this trip</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function formatRange(start: string, end: string): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const from = new Date(start).toLocaleDateString(undefined, options);
  const to = new Date(end).toLocaleDateString(undefined, { ...options, year: 'numeric' });
  return `${from} – ${to}`;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  header: { padding: spacing.lg, backgroundColor: colors.background },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  dates: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  notes: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: spacing.md,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  tabsBar: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabLabel: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  tabLabelActive: { color: colors.primary },
  section: { padding: spacing.lg },
  deleteButton: { padding: spacing.lg, alignItems: 'center' },
  deleteLabel: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '600' },
});
