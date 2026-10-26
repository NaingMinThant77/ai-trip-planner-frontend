import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as exploreApi from '../api/explore';
import * as profileApi from '../api/profile';

export const exploreKeys = {
  destinations: (q: string, region: string) => ['destinations', q, region] as const,
  regions: ['regions'] as const,
  suggestions: ['suggestions'] as const,
  trending: ['trending'] as const,
  destination: (slug: string) => ['destination', slug] as const,
  profile: ['profile'] as const,
};

export function useDestinations(q: string, region: string) {
  return useQuery({
    queryKey: exploreKeys.destinations(q, region),
    queryFn: () => exploreApi.listDestinations({ q: q || undefined, region: region || undefined }),
  });
}

export function useDestination(slug: string) {
  return useQuery({
    queryKey: exploreKeys.destination(slug),
    queryFn: () => exploreApi.getDestination(slug),
    // The guide is seeded editorial content; it does not change while the app is open.
    staleTime: Infinity,
  });
}

export function useRegions() {
  return useQuery({
    queryKey: exploreKeys.regions,
    queryFn: exploreApi.listRegions,
    staleTime: Infinity,
  });
}

export function useSuggestions() {
  return useQuery({ queryKey: exploreKeys.suggestions, queryFn: exploreApi.listSuggestions });
}

export function useTrending() {
  return useQuery({ queryKey: exploreKeys.trending, queryFn: exploreApi.listTrending });
}

export function useProfile() {
  return useQuery({ queryKey: exploreKeys.profile, queryFn: profileApi.getProfile });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name?: string; homeCity?: string; interests?: string[] }) =>
      profileApi.updateProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(exploreKeys.profile, profile);
      // Suggestions are ranked against interests, so they are stale the moment those change.
      void queryClient.invalidateQueries({ queryKey: exploreKeys.suggestions });
    },
  });
}
