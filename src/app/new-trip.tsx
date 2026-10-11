import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { TextField } from '../components/ui/text-field';
import { useGenerateTripCover, useUploadTripCover } from '../hooks/use-trip-cover';
import { useCreateTrip } from '../hooks/use-trips';
import { colors, fontSize, radii, spacing } from '../theme';

/** Mirrors MAX_TRIP_DAYS on the server so the error arrives before the round trip. */
const MAX_TRIP_DAYS = 14;

export default function NewTripScreen() {
  const router = useRouter();
  const createTrip = useCreateTrip();
  const uploadCover = useUploadTripCover();
  const generateCover = useGenerateTripCover();

  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(() => addDays(new Date(), 30));
  const [endDate, setEndDate] = useState(() => addDays(new Date(), 34));
  const [travelers, setTravelers] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverImagePublicId, setCoverImagePublicId] = useState<string | null>(null);
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    if (!coverImageUrl) {
      setError('Add a cover photo — upload one or generate one with AI.');
      return;
    }

    const travelerCount = travelers.trim() ? Number.parseInt(travelers, 10) : undefined;
    if (travelers.trim() && (!Number.isFinite(travelerCount) || travelerCount! < 1 || travelerCount! > 20)) {
      setError('Travellers must be a number between 1 and 20.');
      return;
    }

    createTrip.mutate(
      {
        title: title.trim(),
        source: source.trim(),
        destination: destination.trim(),
        startDate: toIsoDate(startDate),
        endDate: toIsoDate(endDate),
        travelers: travelerCount,
        coverImageUrl,
        coverImagePublicId: coverImagePublicId ?? undefined,
        notes: description.trim() || undefined,
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
            minimumDate={picker === 'end' ? startDate : new Date()}
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
                setCoverImageUrl(null);
                setCoverImagePublicId(null);
              }}
              style={styles.coverRemove}
            >
              <Ionicons name="close" size={16} color={colors.textInverse} />
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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Save Trip"
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
