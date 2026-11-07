import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
import { GradientButton } from '../ui/gradient-button';
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
        <LinearGradient
          colors={['#CFF1E9', '#E8F7F3', colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Ionicons name={isEdit ? 'create' : 'airplane'} size={22} color={colors.textInverse} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{isEdit ? 'Update your trip' : 'Plan a new trip'}</Text>
            <Text style={styles.heroBody}>
              {isEdit ? 'Change anything — your plan stays saved.' : 'A few details and your itinerary is on its way.'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.brandSoft }]}>
              <Ionicons name="map-outline" size={18} color={colors.brandDark} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Trip details</Text>
              <Text style={styles.cardSub}>Where you're going</Text>
            </View>
          </View>
          <TextField
            label="Trip Title"
            variant="pill"
            icon="text-outline"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Japan Adventure"
          />

          <TextField
            label="From"
            variant="pill"
            icon="navigate-circle-outline"
            value={source}
            onChangeText={setSource}
            placeholder="e.g. New Delhi, India"
          />

          <TextField
            label="Destination"
            variant="pill"
            icon="location-outline"
            value={destination}
            onChangeText={setDestination}
            placeholder="e.g. Tokyo, Japan"
          />

        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.infoSoft }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.info} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Dates</Text>
              <Text style={styles.cardSub}>Up to {MAX_TRIP_DAYS} days</Text>
            </View>
          </View>
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
            <View style={styles.daysPill}>
              <Ionicons name="moon-outline" size={14} color={colors.brandDark} />
              <Text style={styles.daysSummary}>
                {days} {days === 1 ? 'Day' : 'Days'} · {Math.max(days - 1, 0)}{' '}
                {days - 1 === 1 ? 'Night' : 'Nights'}
              </Text>
            </View>
          ) : null}

        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="image-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Cover photo</Text>
              <Text style={styles.cardSub}>Upload one or let AI create it</Text>
            </View>
          </View>
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
                  <ActivityIndicator color={colors.brandDark} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={26} color={colors.brandDark} />
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
                  <ActivityIndicator color={colors.brandDark} />
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={26} color={colors.brandDark} />
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
                <Ionicons name="cloud-upload-outline" size={16} color={colors.brandDark} />
                <Text style={styles.changeText}>Upload new</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={generateImage}
                disabled={isBusyWithImage}
                style={[styles.changeButton, isBusyWithImage && styles.disabled]}
              >
                {isBusyWithImage ? (
                  <ActivityIndicator size="small" color={colors.brandDark} />
                ) : (
                  <Ionicons name="sparkles-outline" size={16} color={colors.brandDark} />
                )}
                <Text style={styles.changeText}>Generate new</Text>
              </Pressable>
            </View>
          ) : null}

        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.brandSoft }]}>
              <Ionicons name="sparkles-outline" size={18} color={colors.brandDark} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Extras</Text>
              <Text style={styles.cardSub}>Optional</Text>
            </View>
          </View>
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
            variant="pill"
            icon="people-outline"
            value={travelers}
            onChangeText={setTravelers}
            keyboardType="number-pad"
            placeholder="Just me"
          />

        </View>

        {error ?? serverError ? <Text style={styles.error}>{error ?? serverError}</Text> : null}

        <GradientButton label={submitLabel} onPress={handleSubmit} isLoading={isPending} />
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
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  heroText: { flex: 1 },
  heroTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  heroBody: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  cardSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  daysPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.brandSoft,
  },
  dates: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xs },
  dateField: { flex: 1 },
  dateBox: {
    minHeight: 50,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  daysSummary: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDark },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  imageActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  imageActionBox: {
    flex: 1,
    minHeight: 96,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.brand,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brandSoft,
  },
  imageActionText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.brandDark,
    textAlign: 'center',
  },
  disabled: { opacity: 0.6 },
  hidden: { opacity: 0 },
  changeRow: { flexDirection: 'row', gap: spacing.md },
  changeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.brandSoft,
  },
  changeText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDark },
  coverPreviewWrap: {
    marginBottom: spacing.sm,
    borderRadius: radii.lg,
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
