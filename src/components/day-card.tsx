import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing, timeOfDayLabel } from '../theme';
import { TripDay } from '../types/api';
import { Button } from './ui/button';

export function DayCard({
  day,
  onRegenerate,
  isRegenerating,
}: {
  day: TripDay;
  onRegenerate: () => void;
  isRegenerating: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.dayNumber}>Day {day.dayNumber}</Text>
          <Text style={styles.title}>{day.title}</Text>
          <Text style={styles.date}>
            {new Date(day.date).toLocaleDateString(undefined, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>
      </View>

      <Text style={styles.summary}>{day.summary}</Text>

      {day.activities.map((activity) => (
        <View key={activity.id} style={styles.activity}>
          <View style={styles.activityHeader}>
            <Text style={styles.slot}>{timeOfDayLabel[activity.timeOfDay]}</Text>
            <Text style={styles.duration}>{formatDuration(activity.durationMin)}</Text>
          </View>

          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.location}>{activity.location}</Text>
          <Text style={styles.description}>{activity.description}</Text>

          {activity.costEstimate ? (
            // Framed as a rough guide — the model is not a pricing source (01-product.md).
            <Text style={styles.cost}>Rough cost: {activity.costEstimate}</Text>
          ) : null}
        </View>
      ))}

      <Button
        label={isRegenerating ? 'Replanning…' : 'Replan this day'}
        variant="secondary"
        onPress={onRegenerate}
        isLoading={isRegenerating}
        style={styles.regenerate}
      />
    </View>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  headerText: { flex: 1 },
  dayNumber: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: 2 },
  date: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  summary: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  activity: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  slot: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary },
  duration: { fontSize: fontSize.xs, color: colors.textMuted },
  activityTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginTop: 4 },
  location: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  description: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20, marginTop: spacing.sm },
  cost: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
  regenerate: { marginTop: spacing.xs },
});
