import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ApiError } from '../api/client';
import { TripForm } from '../components/trips/trip-form';
import { ErrorState, LoadingState } from '../components/ui/screen-state';
import { useTrip, useUpdateTrip } from '../hooks/use-trips';

export default function EditTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const trip = useTrip(id ?? '');
  const updateTrip = useUpdateTrip(id ?? '');
  const [error, setError] = useState<string | null>(null);

  if (trip.isPending) return <LoadingState label="Loading trip…" />;
  if (trip.isError) {
    return (
      <ErrorState
        message={trip.error instanceof ApiError ? trip.error.message : 'Could not load this trip.'}
        onRetry={() => void trip.refetch()}
      />
    );
  }

  return (
    <TripForm
      mode="edit"
      initial={trip.data}
      submitLabel="Save changes"
      isPending={updateTrip.isPending}
      serverError={error}
      onSubmit={(values) => {
        setError(null);
        updateTrip.mutate(
          {
            title: values.title,
            source: values.source,
            destination: values.destination,
            startDate: values.startDate,
            endDate: values.endDate,
            travelers: values.travelers,
            // '' (not undefined) is how a cleared description reaches the server: an omitted
            // field means "leave as is".
            notes: values.notes ?? '',
            // Only sent when the cover was replaced; otherwise the existing one stays.
            ...(values.coverImageUrl
              ? {
                  coverImageUrl: values.coverImageUrl,
                  coverImagePublicId: values.coverImagePublicId ?? undefined,
                }
              : {}),
          },
          {
            onSuccess: () => router.back(),
            onError: (caught) =>
              setError(caught instanceof ApiError ? caught.message : 'Could not save your changes.'),
          },
        );
      }}
    />
  );
}
