import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError, toAbsoluteUrl } from '../../api/client';
import { useDeletePhoto, usePhotos, useUploadPhoto } from '../../hooks/use-photos';
import { colors, fontSize, radii, spacing } from '../../theme';
import { ViewerRole } from '../../types/api';
import { Button } from '../ui/button';
import { ErrorState, LoadingState } from '../ui/screen-state';
import { confirmAction } from '../ui/confirm-host';

export function PhotosSection({
  tripId,
  viewerRole,
}: {
  tripId: string;
  viewerRole: ViewerRole;
}) {
  const canEdit = viewerRole !== 'viewer';
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
    confirmAction({
      title: 'Remove this photo?',
      message: 'The photo will be deleted from this trip.',
      confirmLabel: 'Remove',
      icon: 'image',
      onConfirm: () =>
        remove.mutate(photoId, {
          onError: (error) =>
            Alert.alert(
              'Could not remove photo',
              error instanceof ApiError ? error.message : 'Please try again.',
            ),
        }),
    });
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
      {canEdit ? (
        <Button
          label={upload.isPending ? 'Uploading…' : 'Add a photo'}
          onPress={() => void pickAndUpload()}
          isLoading={upload.isPending}
        />
      ) : null}

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
            <View key={photo.id} style={styles.tile}>
              <Image
                accessibilityLabel={photo.caption ?? 'Trip photo'}
                source={{ uri: toAbsoluteUrl(photo.url) }}
                style={styles.image}
                contentFit="cover"
                transition={150}
              />
              {canEdit ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                  onPress={() => confirmDelete(photo.id)}
                  disabled={remove.isPending && remove.variables === photo.id}
                  hitSlop={8}
                  style={({ pressed }) => [styles.removeButton, pressed && styles.removePressed]}
                >
                  {remove.isPending && remove.variables === photo.id ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <Ionicons name="close" size={16} color={colors.textInverse} />
                  )}
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}

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
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePressed: { opacity: 0.7 },
});
