import { useQuery } from '@tanstack/react-query';

type WikipediaSummary = {
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
};

/**
 * Real destination photo, no API key required: Wikipedia's public REST summary endpoint
 * returns a page thumbnail for free, with CORS already open for external apps. Trips store a
 * single free-text destination (e.g. "San Jose, CA"), and the part before the first comma is
 * usually the actual place name a Wikipedia page exists for — the full string with a state/
 * country suffix often fails to resolve.
 */
export function useDestinationImage(destination: string) {
  const title = destination.split(',')[0]?.trim() || destination;

  return useQuery({
    queryKey: ['destination-image', title],
    queryFn: async () => {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      );
      if (!response.ok) return null;
      const data = (await response.json()) as WikipediaSummary;
      return data.originalimage?.source ?? data.thumbnail?.source ?? null;
    },
    enabled: title.length > 0,
    staleTime: Infinity,
    retry: false,
  });
}
