import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError } from '../api/client';
import { Button } from '../components/ui/button';
import { Chip } from '../components/ui/chip';
import { TextField } from '../components/ui/text-field';
import { useCreateTrip } from '../hooks/use-trips';
import { budgetTierLabel, colors, fontSize, radii, spacing } from '../theme';
import { BUDGET_TIERS, BudgetTier } from '../types/api';

const INTEREST_OPTIONS = [
  'food',
  'history',
  'nature',
  'hiking',
  'art',
  'architecture',
  'nightlife',
  'markets',
  'coast',
  'photography',
];

/** Mirrors MAX_TRIP_DAYS on the server so the error arrives before the round trip. */
const MAX_TRIP_DAYS = 14;

export default function NewTripScreen() {
  const router = useRouter();
  const createTrip = useCreateTrip();

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(() => addDays(new Date(), 30));
  const [endDate, setEndDate] = useState(() => addDays(new Date(), 34));
  const [travelers, setTravelers] = useState('2');
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('mid');
  const [interests, setInterests] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleInterest(interest: string): void {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  function handleSubmit(): void {
    setError(null);

    if (destination.trim().length < 2) {
      setError('Where are you going?');
      return;
    }

    const travelerCount = Number.parseInt(travelers, 10);
    if (!Number.isFinite(travelerCount) || travelerCount < 1 || travelerCount > 20) {
      setError('Travellers must be a number between 1 and 20.');
      return;
    }
    if (endDate < startDate) {
      setError('The return date cannot be before the departure date.');
      return;
    }

    const days = Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
    if (days > MAX_TRIP_DAYS) {
      setError(`Trips are limited to ${MAX_TRIP_DAYS} days for now.`);
      return;
    }

    createTrip.mutate(
      {
        destination: destination.trim(),
        startDate: toIsoDate(startDate),
        endDate: toIsoDate(endDate),
        travelers: travelerCount,
        budgetTier,
        interests,
        notes: notes.trim() || undefined,
      },
      {
        // Replace, not push: backing out of the new trip should not return to this form.
        onSuccess: (trip) => router.replace(`/trip/${trip.id}`),
        onError: (caught) =>
          setError(caught instanceof ApiError ? caught.message : 'Could not create the trip.'),
      },
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="Destination"
          value={destination}
          onChangeText={setDestination}
          placeholder="Kyoto, Lisbon, Cape Town…"
        />

        <View style={styles.dates}>
          <DateField
            label="Departing"
            value={startDate}
            onPress={() => setPicker('start')}
            style={styles.dateField}
          />
          <DateField
            label="Returning"
            value={endDate}
            onPress={() => setPicker('end')}
            style={styles.dateField}
          />
        </View>

        {picker !== null ? (
          <DateTimePicker
            value={picker === 'start' ? startDate : endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={picker === 'end' ? startDate : new Date()}
            onChange={(event, selected) => {
              // Android fires 'dismissed' on cancel; iOS keeps the inline picker open.
              if (Platform.OS === 'android') setPicker(null);
              if (event.type === 'dismissed' || !selected) return;

              if (picker === 'start') {
                setStartDate(selected);
                // Keep the range valid rather than rejecting it later.
                if (endDate < selected) setEndDate(addDays(selected, 3));
              } else {
                setEndDate(selected);
              }
            }}
          />
        ) : null}

        {picker !== null && Platform.OS === 'ios' ? (
          <Button label="Done" variant="secondary" onPress={() => setPicker(null)} />
        ) : null}

        <TextField
          label="Travellers"
          value={travelers}
          onChangeText={setTravelers}
          keyboardType="number-pad"
          placeholder="2"
        />

        <Text style={styles.label}>Budget</Text>
        <View style={styles.chips}>
          {BUDGET_TIERS.map((tier) => (
            <Chip
              key={tier}
              label={budgetTierLabel[tier]}
              isSelected={budgetTier === tier}
              onPress={() => setBudgetTier(tier)}
            />
          ))}
        </View>

        <Text style={styles.label}>Interests</Text>
        <View style={styles.chips}>
          {INTEREST_OPTIONS.map((interest) => (
            <Chip
              key={interest}
              label={interest}
              isSelected={interests.includes(interest)}
              onPress={() => toggleInterest(interest)}
            />
          ))}
        </View>

        <TextField
          label="Anything else? (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Travelling with a toddler, no early starts…"
          multiline
          numberOfLines={3}
          style={styles.notes}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Create trip"
          onPress={handleSubmit}
          isLoading={createTrip.isPending}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DateField({
  label,
  value,
  onPress,
  style,
}: {
  label: string;
  value: Date;
  onPress: () => void;
  style?: object;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={style}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dateBox}>
        <Text style={styles.dateText}>
          {value.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>
    </Pressable>
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/** Date-only ISO string; the server treats these as calendar dates, not instants. */
function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  dates: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  dateField: { flex: 1 },
  dateBox: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  dateText: { fontSize: fontSize.md, color: colors.text },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  notes: { minHeight: 80, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: fontSize.sm, marginBottom: spacing.md },
});
