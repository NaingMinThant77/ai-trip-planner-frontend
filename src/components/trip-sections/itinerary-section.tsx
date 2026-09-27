import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../api/client';
import { useAddActivity, useDeleteActivity, useUpdateActivity } from '../../hooks/use-trips';
import { formatClock, formatDuration, minutesOfDay } from '../../lib/clock';
import { colors, fontSize, jellyShadowSmall, radii, spacing } from '../../theme';
import { Activity, CreateActivityInput, TripDetail } from '../../types/api';
import { ActivityFormModal } from '../activity-form-modal';

type IconName = ComponentProps<typeof Ionicons>['name'];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Which day/activity the add-or-edit sheet is currently working with, if any. */
type ModalState =
  | { visible: false }
  | { visible: true; mode: 'create'; dayNumber: number }
  | { visible: true; mode: 'edit'; activity: Activity };

/** One box in the day picker. `activities` is empty for a day nobody has planned yet — the
 * server only creates the day row when its first stop is added. */
type PlannerDay = { dayNumber: number; date: Date; activities: Activity[] };

export function ItinerarySection({ trip }: { trip: TripDetail }) {
  const canEdit = trip.viewerRole !== 'viewer';
  const addActivity = useAddActivity(trip.id);
  const updateActivity = useUpdateActivity(trip.id);
  const deleteActivity = useDeleteActivity(trip.id);

  const [modalState, setModalState] = useState<ModalState>({ visible: false });
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);

  const days = buildDays(trip);
  const selectedDay = days.find((day) => day.dayNumber === selectedDayNumber) ?? days[0] ?? null;

  function closeModal(): void {
    setModalState({ visible: false });
  }

  function confirmDelete(activity: Activity): void {
    Alert.alert('Remove this stop?', `"${activity.title}" will be removed from your plan.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          deleteActivity.mutate(activity.id, {
            onError: (error) =>
              Alert.alert(
                'Could not remove that stop',
                error instanceof ApiError ? error.message : 'Please try again.',
              ),
          }),
      },
    ]);
  }

  function handleSubmitActivity(input: CreateActivityInput): void {
    if (!modalState.visible) return;

    if (modalState.mode === 'create') {
      addActivity.mutate(
        { dayNumber: modalState.dayNumber, activity: input },
        {
          onSuccess: closeModal,
          onError: (error) =>
            Alert.alert(
              'Could not add that stop',
              error instanceof ApiError ? error.message : 'Please try again.',
            ),
        },
      );
    } else {
      updateActivity.mutate(
        { activityId: modalState.activity.id, activity: input },
        {
          onSuccess: closeModal,
          onError: (error) =>
            Alert.alert(
              'Could not save that stop',
              error instanceof ApiError ? error.message : 'Please try again.',
            ),
        },
      );
    }
  }

  const deletingActivityId = deleteActivity.isPending ? deleteActivity.variables ?? null : null;
  const isModalPending =
    modalState.visible && modalState.mode === 'create'
      ? addActivity.isPending
      : updateActivity.isPending;

  function openCreate(): void {
    if (selectedDay) setModalState({ visible: true, mode: 'create', dayNumber: selectedDay.dayNumber });
  }

  return (
    <View>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Day-by-day plan</Text>
        {canEdit && selectedDay ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a stop to the selected day"
            onPress={openCreate}
            hitSlop={8}
            style={({ pressed }) => [styles.addStop, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={18} color={colors.brand} />
            <Text style={styles.addStopLabel}>Add stop</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.pickerCard}>
        <Text style={styles.pickerLabel}>Select day</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerRow}
        >
          {days.map((day) => {
            const isSelected = selectedDay?.dayNumber === day.dayNumber;
            return (
              <Pressable
                key={day.dayNumber}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Day ${day.dayNumber}, ${formatLong(day.date)}, ${day.activities.length} stops`}
                onPress={() => setSelectedDayNumber(day.dayNumber)}
                style={[styles.dayBox, isSelected && styles.dayBoxActive]}
              >
                <Text style={[styles.dayWeekday, isSelected && styles.dayTextActive]}>
                  {day.date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
                </Text>
                <Text style={[styles.dayDate, isSelected && styles.dayTextActive]}>
                  {day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
                <View style={[styles.dayBadge, isSelected && styles.dayBadgeActive]}>
                  <Text style={[styles.dayBadgeText, isSelected && styles.dayTextActive]}>
                    {day.activities.length}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {selectedDay ? (
        <>
          <Text style={styles.dayHeading}>{formatLong(selectedDay.date)}</Text>

          {selectedDay.activities.length === 0 ? (
            <View style={styles.emptyDay}>
              <Ionicons name="map-outline" size={26} color={colors.brand} />
              <Text style={styles.emptyTitle}>Nothing planned for this day</Text>
              <Text style={styles.emptyBody}>
                {canEdit
                  ? 'Add places to visit, meals and check-ins to build your plan.'
                  : 'The trip owner has not added any stops yet.'}
              </Text>
              {canEdit ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={openCreate}
                  style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
                >
                  <Ionicons name="add" size={18} color={colors.textInverse} />
                  <Text style={styles.emptyButtonLabel}>Add first stop</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            selectedDay.activities.map((activity, index) => (
              <TimelineItem
                key={activity.id}
                activity={activity}
                isLast={index === selectedDay.activities.length - 1}
                canEdit={canEdit}
                isDeleting={deletingActivityId === activity.id}
                onEdit={() => setModalState({ visible: true, mode: 'edit', activity })}
                onDelete={() => confirmDelete(activity)}
              />
            ))
          )}
        </>
      ) : null}

      <ActivityFormModal
        visible={modalState.visible}
        mode={modalState.visible ? modalState.mode : 'create'}
        initialValue={modalState.visible && modalState.mode === 'edit' ? modalState.activity : undefined}
        onSubmit={handleSubmitActivity}
        onClose={closeModal}
        isPending={isModalPending}
      />
    </View>
  );
}

function TimelineItem({
  activity,
  isLast,
  canEdit,
  isDeleting,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  isLast: boolean;
  canEdit: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.rail}>
        <View style={styles.dot} />
        {isLast ? null : <View style={styles.line} />}
      </View>

      <View style={styles.stopCard}>
        <View style={styles.stopHeader}>
          <Text style={styles.stopTitle}>{activity.title}</Text>
          {canEdit ? (
            <View style={styles.stopActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${activity.title}`}
                onPress={onEdit}
                hitSlop={8}
              >
                <Ionicons name="pencil" size={18} color={colors.brand} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${activity.title}`}
                onPress={onDelete}
                disabled={isDeleting}
                hitSlop={8}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.textMuted} />
                ) : (
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                )}
              </Pressable>
            </View>
          ) : null}
        </View>

        <StopMeta
          icon="time-outline"
          text={formatTiming(activity)}
        />
        {activity.location ? <StopMeta icon="location-outline" text={activity.location} /> : null}
        {activity.description ? (
          <StopMeta icon="document-text-outline" text={activity.description} />
        ) : null}
        {activity.costEstimate ? (
          // A rough guide the user typed (or an older generated one) — never a quoted price.
          <StopMeta icon="wallet-outline" text={`Rough cost: ${activity.costEstimate}`} />
        ) : null}
      </View>
    </View>
  );
}

function StopMeta({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.metaRow}>
      <View style={styles.metaIcon}>
        <Ionicons name={icon} size={14} color={colors.brand} />
      </View>
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

/** Every calendar day of the trip, whether or not the server has a row for it yet. */
function buildDays(trip: TripDetail): PlannerDay[] {
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const count = Math.max(1, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1);

  return Array.from({ length: count }, (_, index) => {
    const dayNumber = index + 1;
    const existing = trip.days.find((day) => day.dayNumber === dayNumber);
    return {
      dayNumber,
      date: existing ? new Date(existing.date) : new Date(start.getTime() + index * MS_PER_DAY),
      activities: existing ? [...existing.activities].sort(compareStops) : [],
    };
  });
}

function formatLong(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Clock-timed stops run in time order; generated ones (time of day only) keep their position. */
function compareStops(a: Activity, b: Activity): number {
  if (a.startTime && b.startTime) return minutesOfDay(a.startTime) - minutesOfDay(b.startTime);
  return a.position - b.position;
}

/** Clock range plus length, e.g. "9:00 AM – 10:20 AM · 1h 20m". Stops saved before times
 * existed only have a duration, so that is all they show until they are edited. */
function formatTiming(activity: Activity): string {
  const duration = formatDuration(activity.durationMin);
  if (activity.startTime && activity.endTime) {
    return `${formatClock(activity.startTime)} – ${formatClock(activity.endTime)} · ${duration}`;
  }
  return duration;
}

const styles = StyleSheet.create({
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  heading: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  addStop: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  addStopLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brand },
  pressed: { opacity: 0.7 },
  pickerCard: {
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    ...jellyShadowSmall,
  },
  pickerLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pickerRow: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  dayBox: {
    width: 84,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  dayBoxActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  dayWeekday: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted },
  dayDate: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginTop: 2 },
  dayBadge: {
    marginTop: spacing.sm,
    minWidth: 24,
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  dayBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  dayBadgeText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.brand },
  dayTextActive: { color: colors.textInverse },
  dayHeading: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.brandDark,
    marginBottom: spacing.md,
  },
  timelineRow: { flexDirection: 'row' },
  rail: { width: 24, alignItems: 'center' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.brand,
    marginTop: spacing.xl,
  },
  line: { flex: 1, width: 2, backgroundColor: colors.brandSoft, marginTop: spacing.xs },
  stopCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
    gap: spacing.sm,
    ...jellyShadowSmall,
  },
  stopHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  stopTitle: { flex: 1, fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  stopActions: { flexDirection: 'row', gap: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  metaIcon: {
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: { flex: 1, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 22 },
  emptyDay: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.brand,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  emptyButtonLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textInverse },
});
