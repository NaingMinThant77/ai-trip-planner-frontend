import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as sharingApi from '../api/sharing';

export const shareKeys = {
  state: (tripId: string) => ['share', tripId] as const,
  collaborators: (tripId: string) => ['share', tripId, 'collaborators'] as const,
};

export function useShareState(tripId: string) {
  return useQuery({
    queryKey: shareKeys.state(tripId),
    queryFn: () => sharingApi.getShareState(tripId),
    enabled: tripId.length > 0,
  });
}

export function useToggleShare(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enable: boolean) =>
      enable ? sharingApi.enableShare(tripId) : sharingApi.disableShare(tripId),
    onSuccess: (state) => {
      queryClient.setQueryData(shareKeys.state(tripId), state);
    },
  });
}

export function useCollaborators(tripId: string) {
  return useQuery({
    queryKey: shareKeys.collaborators(tripId),
    queryFn: () => sharingApi.listCollaborators(tripId),
    enabled: tripId.length > 0,
  });
}

export function useAddCollaborator(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { email: string; name?: string }) =>
      sharingApi.addCollaborator(tripId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shareKeys.collaborators(tripId) });
    },
  });
}

export function useRemoveCollaborator(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collaboratorId: string) =>
      sharingApi.removeCollaborator(tripId, collaboratorId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shareKeys.collaborators(tripId) });
    },
  });
}
