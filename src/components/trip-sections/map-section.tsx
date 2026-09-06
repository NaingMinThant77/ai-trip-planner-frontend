import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';
import { TripDetail } from '../../types/api';
import { MapPin, TripMap } from '../trip-map';

export function MapSection({ trip }: { trip: TripDetail }) {
  // Coordinates are optional on every activity — the model omits them when unsure.
  const pins: MapPin[] = trip.days.flatMap((day) =>
    day.activities
      .filter(
        (activity): activity is typeof activity & { latitude: number; longitude: number } =>
          activity.latitude !== null && activity.longitude !== null,
      )
      .map((activity) => ({
        label: `Day ${day.dayNumber}: ${activity.title}`,
        latitude: activity.latitude,
        longitude: activity.longitude,
      })),
  );

  if (trip.days.length === 0) {
    return (
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Nothing to map yet</Text>
        <Text style={styles.noticeBody}>Build the itinerary first and pins will appear here.</Text>
      </View>
    );
  }

  if (pins.length === 0) {
    return (
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>No locations pinned</Text>
        <Text style={styles.noticeBody}>
          The assistant only adds coordinates when it is confident about a place, so this
          itinerary has none. The written locations are still on the Itinerary tab.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <TripMap pins={pins} height={340} />
      <Text style={styles.caption}>
        {pins.length} {pins.length === 1 ? 'location' : 'locations'} · positions are approximate
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  noticeTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  noticeBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  caption: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
