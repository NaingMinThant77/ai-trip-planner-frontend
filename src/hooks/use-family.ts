import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as familyApi from '../api/family';

export const familyKeys = {
  all: ['family'] as const,
};

export function useFamily() {
  return useQuery({ queryKey: familyKeys.all, queryFn: familyApi.listFamily });
}

export function useAddFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => familyApi.addFamilyMember(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: familyKeys.all });
    },
  });
}

export function useRemoveFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => familyApi.removeFamilyMember(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: familyKeys.all });
    },
  });
}
