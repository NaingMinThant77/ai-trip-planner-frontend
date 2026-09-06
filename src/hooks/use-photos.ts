import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as photosApi from '../api/photos';

export const photoKeys = {
  list: (tripId: string) => ['photos', tripId] as const,
};

export function usePhotos(tripId: string) {
  return useQuery({
    queryKey: photoKeys.list(tripId),
    queryFn: () => photosApi.listPhotos(tripId),
    enabled: tripId.length > 0,
  });
}

export function useUploadPhoto(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      uri: string;
      fileName: string;
      mimeType: string;
      caption?: string;
    }) => photosApi.uploadPhoto(tripId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: photoKeys.list(tripId) });
    },
  });
}

export function useDeletePhoto(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => photosApi.deletePhoto(tripId, photoId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: photoKeys.list(tripId) });
    },
  });
}
