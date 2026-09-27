import { useMutation } from '@tanstack/react-query';
import * as tripCoverApi from '../api/trip-cover';

export function useUploadTripCover() {
  return useMutation({
    mutationFn: (input: { uri: string; fileName: string; mimeType: string }) =>
      tripCoverApi.uploadTripCoverImage(input),
  });
}

export function useGenerateTripCover() {
  return useMutation({
    mutationFn: (destination: string) => tripCoverApi.generateTripCoverImage(destination),
  });
}
