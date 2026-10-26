import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ApiError } from '../api/client';
import { TripForm } from '../components/trips/trip-form';
import { useCreateTrip } from '../hooks/use-trips';

export default function NewTripScreen() {
  const router = useRouter();
  const { destination } = useLocalSearchParams<{ destination?: string }>();
  const createTrip = useCreateTrip();
  const [error, setError] = useState<string | null>(null);

  return (
    <TripForm
      mode="create"
      presetDestination={destination}
      submitLabel="Save Trip"
      isPending={createTrip.isPending}
      serverError={error}
      onSubmit={(values) => {
        setError(null);
        createTrip.mutate(
          {
            title: values.title,
            source: values.source,
            destination: values.destination,
            startDate: values.startDate,
            endDate: values.endDate,
            travelers: values.travelers,
            // The form guarantees a cover in create mode.
            coverImageUrl: values.coverImageUrl ?? '',
            coverImagePublicId: values.coverImagePublicId ?? undefined,
            notes: values.notes,
          },
          {
            // Replace, not push: backing out of the new trip should not return to this form.
            onSuccess: (trip) => router.replace(`/trip/${trip.id}`),
            onError: (caught) =>
              setError(caught instanceof ApiError ? caught.message : 'Could not create the trip.'),
          },
        );
      }}
    />
  );
}
