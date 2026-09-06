import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as packingApi from '../api/packing';
import { PackingCategory, PackingItem } from '../types/api';

export const packingKeys = {
  list: (tripId: string) => ['packing', tripId] as const,
};

export function usePacking(tripId: string) {
  return useQuery({
    queryKey: packingKeys.list(tripId),
    queryFn: () => packingApi.listPacking(tripId),
    enabled: tripId.length > 0,
  });
}

export function useAddPackingItem(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { label: string; category?: PackingCategory; quantity?: number }) =>
      packingApi.createPackingItem(tripId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: packingKeys.list(tripId) });
    },
  });
}

/**
 * Ticking a box should feel instant, so the cache is updated optimistically and rolled back
 * if the request fails.
 */
export function useTogglePackingItem(tripId: string) {
  const queryClient = useQueryClient();
  const key = packingKeys.list(tripId);

  return useMutation({
    mutationFn: (input: { itemId: string; isPacked: boolean }) =>
      packingApi.updatePackingItem(tripId, input.itemId, { isPacked: input.isPacked }),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PackingItem[]>(key);

      queryClient.setQueryData<PackingItem[]>(key, (items) =>
        items?.map((item) =>
          item.id === input.itemId ? { ...item, isPacked: input.isPacked } : item,
        ),
      );

      return { previous };
    },

    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeletePackingItem(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => packingApi.deletePackingItem(tripId, itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: packingKeys.list(tripId) });
    },
  });
}

export function useGeneratePacking(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => packingApi.generatePacking(tripId),
    onSuccess: (items) => {
      queryClient.setQueryData(packingKeys.list(tripId), items);
    },
  });
}
