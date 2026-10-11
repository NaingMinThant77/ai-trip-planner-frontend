import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { parseWallClock } from '../../lib/booking-format';
import { colors, fontSize, radii, spacing } from '../../theme';

type Props = {
  label: string;
  /** `YYYY-MM-DD` or `YYYY-MM-DD HH:mm`, or '' when unset. */
  value: string;
  onChange: (value: string) => void;
  /** `date` yields `YYYY-MM-DD`; `datetime` yields `YYYY-MM-DD HH:mm`. */
  mode?: 'date' | 'datetime';
  placeholder?: string;
  /** Earliest allowed value, same format as `value`. Earlier picks are flagged, not blocked. */
  minimumValue?: string;
  /** Shown under the field when `value` is before `minimumValue`. */
  minimumMessage?: string;
};

const pad = (n: number): string => String(n).padStart(2, '0');

function formatValue(date: Date, mode: 'date' | 'datetime'): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return mode === 'date' ? day : `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Reads the value as written (any trailing `Z` is ignored, see `lib/booking-format`). */
function parseValue(value: string): Date {
  const clock = parseWallClock(value);
  if (!clock) return new Date();
  return new Date(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute);
}

export function isEarlier(value: string, minimum: string): boolean {
  return parseValue(value).getTime() < parseValue(minimum).getTime();
}

export function DateTimeField({
  label,
  value,
  onChange,
  mode = 'datetime',
  placeholder = mode === 'date' ? 'Select date' : 'Select date & time',
  minimumValue,
  minimumMessage = 'Must not be earlier than the start',
}: Props) {
  const isBeforeMinimum =
    Boolean(value) && Boolean(minimumValue) && isEarlier(value, minimumValue as string);
  // Android shows one dialog per step, so the datetime flow is date → time. iOS renders a
  // single inline control that handles both.
  const [step, setStep] = useState<'date' | 'time' | null>(null);
  const [draft, setDraft] = useState<Date>(() => parseValue(value));
  const [isOpenIos, setIsOpenIos] = useState(false);

  function open(): void {
    setDraft(parseValue(value));
    if (Platform.OS === 'ios') setIsOpenIos((current) => !current);
    else setStep('date');
  }

  function handleAndroid(selected: Date): void {
    if (step === 'date' && mode === 'datetime') {
      setDraft(selected);
      setStep('time');
      return;
    }
    // Merge: the time step returns today's date, so keep the day chosen in the date step.
    const merged = new Date(draft);
    if (step === 'time') merged.setHours(selected.getHours(), selected.getMinutes());
    else merged.setTime(selected.getTime());
    setStep(null);
    onChange(formatValue(merged, mode));
  }

  function handleIos(selected: Date): void {
    onChange(formatValue(selected, mode));
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'not set'}`}
        onPress={open}
        style={({ pressed }) => [
          styles.field,
          isBeforeMinimum && styles.fieldError,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
          size={18}
          color={colors.textMuted}
          style={styles.icon}
        />
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        {value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
            hitSlop={spacing.sm}
            onPress={() => onChange('')}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </Pressable>

      {isBeforeMinimum ? <Text style={styles.error}>{minimumMessage}</Text> : null}

      {Platform.OS === 'ios' && isOpenIos ? (
        <View>
          <DateTimePicker
            value={parseValue(value)}
            mode={mode === 'date' ? 'date' : 'datetime'}
            display="inline"
            minimumDate={minimumValue ? parseValue(minimumValue) : undefined}
            onValueChange={(_event, selected) => handleIos(selected)}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (!value) onChange(formatValue(draft, mode));
              setIsOpenIos(false);
            }}
            style={styles.done}
          >
            <Text style={styles.doneLabel}>Done</Text>
          </Pressable>
        </View>
      ) : null}

      {Platform.OS === 'android' && step !== null ? (
        <DateTimePicker
          value={step === 'time' ? draft : parseValue(value)}
          mode={step}
          is24Hour
          minimumDate={minimumValue && step === 'date' ? parseValue(minimumValue) : undefined}
          onValueChange={(_event, selected) => handleAndroid(selected)}
          onDismiss={() => setStep(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  fieldError: { borderColor: colors.danger },
  error: { marginTop: spacing.xs, color: colors.danger, fontSize: fontSize.xs },
  pressed: { opacity: 0.7 },
  icon: { marginRight: spacing.sm },
  value: { flex: 1, fontSize: fontSize.md, color: colors.text },
  placeholder: { color: colors.textMuted },
  done: { alignSelf: 'flex-end', paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  doneLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.brand },
});
