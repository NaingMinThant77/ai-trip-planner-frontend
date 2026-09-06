import { Alert, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../api/client';
import { useGenerateItinerary, useRegenerateDay } from '../../hooks/use-trips';
import { colors, fontSize, radii, spacing } from '../../theme';
import { TripDetail } from '../../types/api';
import { DayCard } from '../day-card';
import { Button } from '../ui/button';

export function ItinerarySection({ trip }: { trip: TripDetail }) {
  const generate = useGenerateItinerary(trip.id);
  const regenerate = useRegenerateDay(trip.id);

  function handleGenerate(): void {
    generate.mutate(undefined, {
      onError: (error) =>
        Alert.alert(
          'Could not build the itinerary',
          error instanceof ApiError ? error.message : 'Please try again.',
        ),
    });
  }

  function handleRegenerate(dayNumber: number): void {
    regenerate.mutate(
      { dayNumber },
      {
        onError: (error) =>
          Alert.alert(
            'Could not replan that day',
            error instanceof ApiError ? error.message : 'Please try again.',
          ),
      },
    );
  }

  if (trip.days.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No itinerary yet</Text>
        <Text style={styles.emptyBody}>
          The assistant will draft a day-by-day plan from your dates, budget and interests.
          It usually takes 10-30 seconds.
        </Text>

        {trip.status === 'failed' ? (
          <Text style={styles.failed}>The last attempt failed. Trying again often works.</Text>
        ) : null}

        <Button
          label={generate.isPending ? 'Planning your trip…' : 'Build my itinerary'}
          onPress={handleGenerate}
          isLoading={generate.isPending}
          style={styles.action}
        />
      </View>
    );
  }

  return (
    <View>
      {trip.days.map((day) => (
        <DayCard
          key={day.id}
          day={day}
          onRegenerate={() => handleRegenerate(day.dayNumber)}
          isRegenerating={regenerate.isPending && regenerate.variables?.dayNumber === day.dayNumber}
        />
      ))}

      <Button
        label={generate.isPending ? 'Rebuilding…' : 'Rebuild the whole itinerary'}
        variant="secondary"
        onPress={handleGenerate}
        isLoading={generate.isPending}
      />
      <Text style={styles.warning}>Rebuilding replaces every day, including ones you like.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  emptyBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  failed: { fontSize: fontSize.xs, color: colors.danger, marginTop: spacing.md },
  action: { alignSelf: 'stretch', marginTop: spacing.xl },
  warning: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
