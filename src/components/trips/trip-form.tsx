import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError } from '../../api/client';
import { useGenerateTripCover, useUploadTripCover } from '../../hooks/use-trip-cover';
import { colors, fontSize, radii, spacing } from '../../theme';
import { Button } from '../ui/button';
import { KeyboardSafeView } from '../ui/keyboard-safe-view';
import { TextField } from '../ui/text-field';

/** Mirrors MAX_TRIP_DAYS on the server so the error arrives before the round trip. */
const MAX_TRIP_DAYS = 14;

/** What the form hands back once every field has passed validation. */
export type TripFormValues = {
  title: string;
  source: string;
  destination: string;
  /** YYYY-MM-DD, the calendar date the traveller picked. */
  startDate: string;
  endDate: string;
  travelers?: number;
  notes?: string;
  /** Set only if there is a cover (create) or the traveller replaced it (edit). */
  coverImageUrl: string | null;
  coverImagePublicId: string | null;
};

export type TripFormInitial = {
  title: string;
  source: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  notes: string | null;
  coverImageUrl: string | null;
};

type Props = {
  mode: 'create' | 'edit';
  /** Present in edit mode. Dates are ISO strings from the API. */
  initial?: TripFormInitial;
  /** Pre-fills the destination on a new trip, e.g. when arriving from an Explore card. */
  presetDestination?: string;
  submitLabel: string;
  isPending: boolean;
  /** An error from the server, shown under the form. */
  serverError: string | null;
  onSubmit: (values: TripFormValues) => void;
};

/**
 * The trip fields, shared by New trip and Edit trip. Create demands a cover and a future start;
 * edit keeps the existing cover unless it is replaced and allows dates already in the past, since
 * a trip that is under way still has to be editable.
 */
export function TripForm({
  mode,
  initial,
  presetDestination,
  submitLabel,
  isPending,
  serverError,
  onSubmit,
}: Props) {
  const isEdit = mode === 'edit';
  const uploadCover = useUploadTripCover();
  const generateCover = useGenerateTripCover();

  const [title, setTitle] = useState(initial?.title ?? '');
  const [source, setSource] = useState(initial?.source ?? '');
  const [destination, setDestination] = useState(initial?.destination ?? presetDestination ?? '');
  const [startDate, setStartDate] = useState(() =>
    initial ? parseCalendarDate(initial.startDate) : addDays(new Date(), 30),
  );
  const [endDate, setEndDate] = useState(() =>
    initial ? parseCalendarDate(initial.endDate) : addDays(new Date(), 34),
  );
  const [travelers, setTravelers] = useState(initial ? String(initial.travelers) : '');
  const [description, setDescription] = useState(initial?.notes ?? '');
  // In edit mode the existing cover is shown, but only a *new* one is sent back.
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(initial?.coverImageUrl ?? null);
  const [coverImagePublicId, setCoverImagePublicId] = useState<string | null>(null);
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const coverChanged = coverImagePublicId !== null;

  const isBusyWithImage = uploadCover.isPending || generateCover.isPending;
  const days = Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;

  async function pickAndUploadImage(): Promise<void> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access in Settings to add a cover photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];

    uploadCover.mutate(
      {
        uri: asset.uri,
        fileName: asset.fileName ?? `cover-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      },
      {
        onSuccess: (image) => {
          setCoverImageUrl(image.url);
          setCoverImagePublicId(image.publicId);
        },
        onError: (caught) =>
          Alert.alert('Upload failed', caught instanceof ApiError ? caught.message : 'Please try again.'),
      },
    );
  }

  function generateImage(): void {
    if (destination.trim().length < 2) {
      setError('Enter a destination first so the image matches your trip.');
      return;
    }
    setError(null);

    generateCover.mutate(destination.trim(), {
      onSuccess: (image) => {
        setCoverImageUrl(image.url);
        setCoverImagePublicId(image.publicId);
      },
      onError: (caught) =>
        Alert.alert(
          'Could not generate an image',
          caught instanceof ApiError ? caught.message : 'Please try again, or upload one instead.',
        ),
    });
  }

  function handleSubmit(): void {
    setError(null);

    if (title.trim().length === 0) {
      setError('Give your trip a title.');
      return;
    }
    if (source.trim().length < 2) {
      setError('Where are you travelling from?');
      return;
    }
    if (destination.trim().length < 2) {
      setError('Where are you going?');
      return;
    }
    if (endDate < startDate) {
      setError('The return date cannot be before the departure date.');
      return;
    }
    if (days > MAX_TRIP_DAYS) {
      setError(`Trips are limited to ${MAX_TRIP_DAYS} days for now.`);
      return;
    }
    if (!isEdit && !coverImageUrl) {
      setError('Add a cover photo — upload one or generate one with AI.');
      return;
    }

    const travelerCount = travelers.trim() ? Number.parseInt(travelers, 10) : undefined;
    if (travelers.trim() && (!Number.isFinite(travelerCount) || travelerCount! < 1 || travelerCount! > 20)) {
      setError('Travellers must be a number between 1 and 20.');
      return;
    }

    onSubmit({
      title: title.trim(),
      source: source.trim(),
      destination: destination.trim(),
      startDate: toIsoDate(startDate),
      endDate: toIsoDate(endDate),
      travelers: travelerCount,
      notes: description.trim() || undefined,
      coverImageUrl: isEdit && !coverChanged ? null : coverImageUrl,
      coverImagePublicId,
    });
  }

  return (
    <KeyboardSafeView
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="Trip Title"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Japan Adventure"
        />

        <TextField
          label="Source"
          value={source}
          onChangeText={setSource}
          placeholder="e.g. New Delhi, India"
        />

        <TextField
          label="Destination"
          value={destination}
          onChangeText={setDestination}
          placeholder="e.g. Tokyo, Japan"
        />

        <Text style={styles.label}>Trip Days</Text>
        <View style={styles.dates}>
          <DateField
            label="Start date"
            value={startDate}
            onPress={() => setPicker('start')}
            style={styles.dateField}
          />
          <DateField
            label="End date"
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
            minimumDate={picker === 'end' ? startDate : isEdit ? undefined : new Date()}
            onDismiss={() => setPicker(null)}
            onValueChange={(_event, selected) => {
              // Android dialog closes itself; iOS keeps the inline picker open until Done.
              if (Platform.OS === 'android') setPicker(null);

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

        {days > 0 ? (
          <Text style={styles.daysSummary}>
            {days} {days === 1 ? 'Day' : 'Days'} ({Math.max(days - 1, 0)}{' '}
            {days - 1 === 1 ? 'Night' : 'Nights'})
          </Text>
        ) : null}

        <Text style={styles.label}>Trip Image</Text>
        {coverImageUrl ? (
          <View style={styles.coverPreviewWrap}>
            <Image source={{ uri: coverImageUrl }} style={styles.coverPreview} contentFit="cover" transition={150} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove cover photo"
              onPress={() => {
                // Create: drop it. Edit: go back to the cover the trip already had.
                setCoverImageUrl(initial?.coverImageUrl ?? null);
                setCoverImagePublicId(null);
              }}
              style={[styles.coverRemove, isEdit && !coverChanged && styles.hidden]}
              disabled={isEdit && !coverChanged}
            >
              <Ionicons name={isEdit ? 'arrow-undo' : 'close'} size={16} color={colors.textInverse} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.imageActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void pickAndUploadImage()}
              disabled={isBusyWithImage}
              style={[styles.imageActionBox, isBusyWithImage && styles.disabled]}
            >
              {uploadCover.isPending ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={26} color={colors.primary} />
                  <Text style={styles.imageActionText}>Upload Image</Text>
                </>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={generateImage}
              disabled={isBusyWithImage}
              style={[styles.imageActionBox, isBusyWithImage && styles.disabled]}
            >
              {generateCover.isPending ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={26} color={colors.primary} />
                  <Text style={styles.imageActionText}>Generate with AI</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {isEdit && coverImageUrl && !coverChanged ? (
          <View style={styles.changeRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void pickAndUploadImage()}
              disabled={isBusyWithImage}
              style={[styles.changeButton, isBusyWithImage && styles.disabled]}
            >
              <Ionicons name="cloud-upload-outline" size={16} color={colors.primary} />
              <Text style={styles.changeText}>Upload new</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={generateImage}
              disabled={isBusyWithImage}
              style={[styles.changeButton, isBusyWithImage && styles.disabled]}
            >
              {isBusyWithImage ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
              )}
              <Text style={styles.changeText}>Generate new</Text>
            </Pressable>
          </View>
        ) : null}

        <TextField
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Write a short description…"
          multiline
          numberOfLines={3}
          maxLength={200}
          style={styles.description}
        />

        <TextField
          label="Travellers (optional)"
          value={travelers}
          onChangeText={setTravelers}
          keyboardType="number-pad"
          placeholder="Just me"
        />

        {error ?? serverError ? <Text style={styles.error}>{error ?? serverError}</Text> : null}

        <Button label={submitLabel} onPress={handleSubmit} isLoading={isPending} />
      </ScrollView>
    </KeyboardSafeView>
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

/**
 * Date-only string built from the *local* calendar date the traveller picked. `toISOString()`
 * would convert to UTC first, which turns "Nov 10" into "Nov 9" for anyone ahead of UTC whose
 * picker value sits shortly after local midnight.
 */
function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The API sends dates as UTC-midnight ISO strings; the calendar date is the first 10 characters. */
function parseCalendarDate(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  dates: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xs },
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
  daysSummary: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  imageActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  imageActionBox: {
    flex: 1,
    minHeight: 96,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  imageActionText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  disabled: { opacity: 0.6 },
  hidden: { opacity: 0 },
  changeRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  changeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  changeText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
  coverPreviewWrap: {
    marginBottom: spacing.lg,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  coverPreview: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceAlt,
  },
  coverRemove: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: { minHeight: 80, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: fontSize.sm, marginBottom: spacing.md },
});
