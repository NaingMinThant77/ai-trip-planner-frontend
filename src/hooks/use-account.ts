import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import * as profileApi from '../api/profile';
import { useAuth } from '../context/auth';
import { exploreKeys } from './use-explore';

/**
 * Account mutations, split from `use-explore` because each one has to keep **two** stores in
 * step: the profile query and the session in `AuthContext` (which is what the tab header and
 * every other screen read the name and avatar from).
 */
function useProfileWriter() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  return async function commit(profile: Awaited<ReturnType<typeof profileApi.getProfile>>) {
    queryClient.setQueryData(exploreKeys.profile, profile);
    await refreshUser();
    return profile;
  };
}

export function useUpdateName() {
  const commit = useProfileWriter();

  return useMutation({
    mutationFn: (name: string) => profileApi.updateProfile({ name }),
    onSuccess: commit,
  });
}

export function useUpdateEmail() {
  const commit = useProfileWriter();

  return useMutation({
    mutationFn: (email: string) => profileApi.updateProfile({ email }),
    onSuccess: commit,
  });
}

export function useUploadAvatar() {
  const commit = useProfileWriter();

  return useMutation({
    mutationFn: (input: { uri: string; fileName: string; mimeType: string }) =>
      profileApi.uploadAvatar(input),
    onSuccess: commit,
  });
}

export function useRemoveAvatar() {
  const commit = useProfileWriter();

  return useMutation({
    mutationFn: profileApi.removeAvatar,
    onSuccess: commit,
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { currentPassword?: string; newPassword: string }) =>
      authApi.changePassword(input),
    // Flips the Account screen from "Set a password" to "Change password".
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: exploreKeys.profile });
    },
  });
}
