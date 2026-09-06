import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError, toAbsoluteUrl } from '../../api/client';
import { useDeletePhoto, usePhotos, useUploadPhoto } from '../../hooks/use-photos';
import { colors, fontSize, radii, spacing } from '../../theme';
import { Button } from '../ui/button';
import { ErrorState, LoadingState } from '../ui/screen-state';

export function PhotosSection({ tripId }: { tripId: string }) {
  const photos = usePhotos(tripId);
  const upload = useUploadPhoto(tripId);
  const remove = useDeletePhoto(tripId);

  async function pickAndUpload(): Promise<void> {
    // Only the media-library permission is requested — the camera is a separate grant we
    // do not need, and asking for both up front reads as overreach.
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo access in Settings to add pictures to this trip.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    upload.mutate(
      {
        uri: asset.uri,
        fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      },
      {
        onError: (error) =>
          Alert.alert(
            'Upload failed',
            error instanceof ApiError ? error.message : 'Please try again.',
          ),
      },
    );
  }

  function confirmDelete(photoId: string): void {
    Alert.alert('Remove photo', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(photoId) },
    ]);
  }

  if (photos.isPending) return <LoadingState label="Loading photos…" />;

  if (photos.isError) {
    return (
      <ErrorState
        message={
          photos.error instanceof ApiError ? photos.error.message : 'Could not load photos.'
        }
        onRetry={() => void photos.refetch()}
      />
    );
  }

  return (
    <View>
      <Button
        label={upload.isPending ? 'Uploading…' : 'Add a photo'}
        onPress={() => void pickAndUpload()}
        isLoading={upload.isPending}
      />

      {photos.data.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptyBody}>
            Add pictures as you go — anyone with the share link can see them.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {photos.data.map((photo) => (
            <Pressable
              key={photo.id}
              accessibilityRole="button"
              accessibilityLabel={photo.caption ?? 'Trip photo'}
              onLongPress={() => confirmDelete(photo.id)}
              style={styles.tile}
            >
              <Image
                source={{ uri: toAbsoluteUrl(photo.url) }}
                style={styles.image}
                contentFit="cover"
                transition={150}
              />
            </Pressable>
          ))}
        </View>
      )}

      {photos.data.length > 0 ? (
        <Text style={styles.hint}>Long-press a photo to remove it.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  emptyBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  tile: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  image: { width: '100%', height: '100%' },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
