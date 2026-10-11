import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  addMinutes,
  formatClock,
  formatDuration,
  fromClock,
  minutesOfDay,
  TIME_OF_DAY_START,
  toClock,
} from '../lib/clock';
import { colors, fontSize, jellyShadow, radii, spacing } from '../theme';
import { Activity, CreateActivityInput } from '../types/api';
import { GradientButton } from './ui/gradient-button';
import { TextField } from './ui/text-field';

const DEFAULT_START = '09:00';
const DEFAULT_END = '10:00';

type Props = {
  visible: boolean;
  mode: 'create' | 'edit';
  /** Only meaningful in edit mode — prefills the form from the activity being edited. */
  initialValue?: Activity;
  onSubmit: (input: CreateActivityInput) => void;
  onClose: () => void;
  isPending?: boolean;
};

export function ActivityFormModal({
  visible,
  mode,
  initialValue,
  onSubmit,
  onClose,
  isPending = false,
}: Props) {
  const [startTime, setStartTime] = useState(DEFAULT_START);
  const [endTime, setEndTime] = useState(DEFAULT_END);
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [costEstimate, setCostEstimate] = useState('');
  const [description, setDescription] = useState('');

  // Re-seed the form whenever the sheet opens, from `initialValue` in edit mode or blank
  // in create mode — this also clears stale input left over from a previous open.
  useEffect(() => {
    if (!visible) return;
    setPicker(null);

    if (mode === 'edit' && initialValue) {
      // Generated stops have no clock times yet; start them from their time-of-day slot.
      const start = initialValue.startTime ?? TIME_OF_DAY_START[initialValue.timeOfDay];
      setStartTime(start);
      setEndTime(initialValue.endTime ?? addMinutes(start, initialValue.durationMin || 60));
      setTitle(initialValue.title);
      setLocation(initialValue.location ?? '');
      setCostEstimate(initialValue.costEstimate ?? '');
      setDescription(initialValue.description ?? '');
    } else {
      setStartTime(DEFAULT_START);
      setEndTime(DEFAULT_END);
      setTitle('');
      setLocation('');
      setCostEstimate('');
      setDescription('');
    }
  }, [visible, mode, initialValue]);

  const trimmedTitle = title.trim();
  const durationMin = minutesOfDay(endTime) - minutesOfDay(startTime);
  const isTimeValid = durationMin > 0;
  const isValid = trimmedTitle.length > 0 && isTimeValid;

  function handlePick(selected: Date): void {
    const clock = toClock(selected);
    if (picker === 'start') {
      // Moving the start keeps the stop's length, so the end is never left behind it.
      const length = isTimeValid ? durationMin : 60;
      setStartTime(clock);
      setEndTime(addMinutes(clock, length));
    } else if (picker === 'end') {
      setEndTime(fixAmPm(clock, startTime));
    }
  }

  function handleSubmit(): void {
    if (!isValid) return;

    // Duration and time-of-day are derived server-side from these two.
    const input: CreateActivityInput = { title: trimmedTitle, startTime, endTime };

    const trimmedLocation = location.trim();
    if (trimmedLocation) input.location = trimmedLocation;

    const trimmedDescription = description.trim();
    if (trimmedDescription) input.description = trimmedDescription;

    const trimmedCost = costEstimate.trim();
    if (trimmedCost) input.costEstimate = trimmedCost;

    onSubmit(input);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrapper}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.heading}>{mode === 'create' ? 'Add a stop' : 'Edit stop'}</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.scroll}
            >
              <TextField
                label="Title"
                value={title}
                onChangeText={setTitle}
                placeholder="Visit the old town"
              />

              <View style={styles.timeRow}>
                <TimeButton
                  label="From"
                  value={formatClock(startTime)}
                  isActive={picker === 'start'}
                  onPress={() => setPicker(picker === 'start' ? null : 'start')}
                />
                <TimeButton
                  label="To"
                  value={formatClock(endTime)}
                  isActive={picker === 'end'}
                  onPress={() => setPicker(picker === 'end' ? null : 'end')}
                />
              </View>

              {picker !== null ? (
                <View>
                  <DateTimePicker
                    value={fromClock(picker === 'start' ? startTime : endTime)}
                    mode="time"
                    is24Hour={false}
                    minuteInterval={5}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onValueChange={(_event, selected) => {
                      // Android shows a dialog that closes itself; iOS stays inline until Done.
                      if (Platform.OS === 'android') setPicker(null);
                      handlePick(selected);
                    }}
                    onDismiss={() => setPicker(null)}
                  />
                  {Platform.OS === 'ios' ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setPicker(null)}
                      style={styles.pickerDone}
                    >
                      <Text style={styles.pickerDoneLabel}>Done</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              <Text style={styles.fieldLabel}>Duration</Text>
              <View
                accessible
                accessibilityLabel={`Duration, ${isTimeValid ? formatDuration(durationMin) : 'invalid'}`}
                style={[styles.readonly, !isTimeValid && styles.readonlyError]}
              >
                <Ionicons
                  name="hourglass-outline"
                  size={16}
                  color={isTimeValid ? colors.textMuted : colors.danger}
                />
                <Text style={[styles.readonlyText, !isTimeValid && styles.readonlyErrorText]}>
                  {isTimeValid ? formatDuration(durationMin) : 'End time must be after start time'}
                </Text>
              </View>

              <TextField
                label="Location"
                value={location}
                onChangeText={setLocation}
                placeholder="Old Town Square"
              />
              <TextField
                label="Rough cost"
                value={costEstimate}
                onChangeText={setCostEstimate}
                placeholder="$20 per person"
              />
              <TextField
                label="Notes"
                value={description}
                onChangeText={setDescription}
                placeholder="What to expect, tips…"
                multiline
                numberOfLines={4}
                style={styles.multiline}
              />
            </ScrollView>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [styles.cancel, pressed && styles.cancelPressed]}
              >
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>

              <GradientButton
                label={
                  isPending
                    ? mode === 'create'
                      ? 'Adding…'
                      : 'Saving…'
                    : mode === 'create'
                      ? 'Add stop'
                      : 'Save changes'
                }
                onPress={handleSubmit}
                isLoading={isPending}
                disabled={!isValid}
                style={styles.submit}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/**
 * The 12-hour picker keeps whatever AM/PM the field already had, so tapping "12" on a
 * 10:00 AM stop gives 12:00 AM (midnight) when the traveller meant noon. An end that falls
 * before the start but lands after it once moved 12 hours is taken as the other half of the
 * day; anything else is left alone for the duration check to flag.
 */
function fixAmPm(end: string, start: string): string {
  const endMinutes = minutesOfDay(end);
  const startMinutes = minutesOfDay(start);
  const flipped = endMinutes + 12 * 60;
  if (endMinutes <= startMinutes && flipped > startMinutes && flipped < 24 * 60) {
    return addMinutes(end, 12 * 60);
  }
  return end;
}

function TimeButton({
  label,
  value,
  isActive,
  onPress,
}: {
  label: string;
  value: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.timeField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} time, ${value}`}
        onPress={onPress}
        style={[styles.timeButton, isActive && styles.timeButtonActive]}
      >
        <Ionicons name="time-outline" size={16} color={colors.brand} />
        <Text style={styles.timeValue}>{value}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetWrapper: { width: '100%' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '88%',
    ...jellyShadow,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  scroll: { flexGrow: 0 },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  timeRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  timeField: { flex: 1 },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 50,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  timeButtonActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  timeValue: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  pickerDone: { alignSelf: 'flex-end', paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  pickerDoneLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.brand },
  readonly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 50,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  readonlyError: { backgroundColor: colors.dangerSoft },
  readonlyText: { fontSize: fontSize.md, color: colors.textMuted, fontWeight: '600' },
  readonlyErrorText: { color: colors.danger, fontSize: fontSize.sm },
  multiline: { minHeight: 90, textAlignVertical: 'top', paddingTop: spacing.sm },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelPressed: { opacity: 0.6 },
  cancelLabel: { fontSize: fontSize.md, fontWeight: '600', color: colors.textMuted },
  submit: { flex: 1 },
});
