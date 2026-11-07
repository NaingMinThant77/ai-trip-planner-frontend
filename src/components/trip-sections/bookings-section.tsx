import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ComponentProps, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../api/client';
import {
  useCreateBooking,
  useDeleteBooking,
  useSavedBookings,
  useUpdateBooking,
} from '../../hooks/use-bookings';
import {
  colors,
  fontSize,
  jellyColors,
  jellyGradients,
  jellyShadow,
  radii,
  spacing,
} from '../../theme';
import { BookingKind, SavedBooking, SaveBookingInput, ViewerRole } from '../../types/api';
import { BookingCard } from '../booking-card';
import { BookingFormModal } from '../booking-form-modal';
import { Chip } from '../ui/chip';
import { confirmAction } from '../ui/confirm-host';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Mockup order is Flight / Car / Hotels / Extra — not the `BOOKING_KINDS` (hotel-first) order. */
const KIND_ORDER: BookingKind[] = ['flight', 'car', 'hotel', 'extra'];

const KIND_META: Record<
  BookingKind,
  {
    label: string;
    icon: IconName;
    color: string;
    soft: string;
    gradient: readonly [string, string];
    emptyTitle: string;
    emptyBody: string;
  }
> = {
  flight: {
    label: 'Flight',
    icon: 'airplane',
    color: jellyColors.sky,
    soft: jellyColors.skySoft,
    gradient: jellyGradients.sky,
    emptyTitle: 'No flights yet',
    emptyBody: 'Add your airline, flight number and times so they travel with the trip.',
  },
  car: {
    label: 'Car',
    icon: 'car-sport',
    color: jellyColors.sun,
    soft: jellyColors.sunSoft,
    gradient: jellyGradients.sun,
    emptyTitle: 'No car hire yet',
    emptyBody: 'Add a rental so pickup and drop-off details are always at hand.',
  },
  hotel: {
    label: 'Hotels',
    icon: 'bed',
    color: jellyColors.grape,
    soft: jellyColors.grapeSoft,
    // `jellyGradients` has no grape entry — mint is the pragmatic stand-in for hotel's CTA/header.
    gradient: jellyGradients.mint,
    emptyTitle: 'No hotels yet',
    emptyBody: 'Add where you are staying, with check-in and check-out dates.',
  },
  extra: {
    label: 'Extra',
    icon: 'ticket',
    color: jellyColors.berry,
    soft: jellyColors.berrySoft,
    gradient: jellyGradients.berry,
    emptyTitle: 'No extras yet',
    emptyBody: 'Tickets, tours or anything else worth keeping on hand.',
  },
};

type FormState = { mode: 'create' } | { mode: 'edit'; booking: SavedBooking };

export function BookingsSection({
  tripId,
  viewerRole,
}: {
  tripId: string;
  viewerRole: ViewerRole;
}) {
  const canEdit = viewerRole !== 'viewer';
  const [kind, setKind] = useState<BookingKind>('flight');
  const [formState, setFormState] = useState<FormState | null>(null);

  const saved = useSavedBookings(tripId);
  const createBooking = useCreateBooking(tripId);
  const updateBooking = useUpdateBooking(tripId);
  const deleteBooking = useDeleteBooking(tripId);

  const meta = KIND_META[kind];
  const bookings = (saved.data ?? []).filter((booking) => booking.kind === kind);
  const isSaving = createBooking.isPending || updateBooking.isPending;

  function handleSubmit(input: SaveBookingInput): void {
    if (formState?.mode === 'edit') {
      updateBooking.mutate(
        { bookingId: formState.booking.id, booking: input },
        {
          onSuccess: () => setFormState(null),
          onError: (error) =>
            Alert.alert(
              'Could not save',
              error instanceof ApiError ? error.message : 'Please try again.',
            ),
        },
      );
    } else {
      createBooking.mutate(input, {
        onSuccess: () => setFormState(null),
        onError: (error) =>
          Alert.alert(
            'Could not save',
            error instanceof ApiError ? error.message : 'Please try again.',
          ),
      });
    }
  }

  function confirmDelete(booking: SavedBooking): void {
    confirmAction({
      title: 'Delete this booking?',
      message: `Remove "${booking.title}" from this trip?`,
      confirmLabel: 'Delete',
      onConfirm: () =>
        deleteBooking.mutate(booking.id, {
          onError: (error) =>
            Alert.alert(
              'Could not delete',
              error instanceof ApiError ? error.message : 'Please try again.',
            ),
        }),
    });
  }

  return (
    <View>
      <View style={styles.tabs}>
        {KIND_ORDER.map((option) => (
          <Chip
            key={option}
            label={KIND_META[option].label}
            isSelected={kind === option}
            onPress={() => setKind(option)}
          />
        ))}
      </View>

      {bookings.length === 0 ? (
        <View style={[styles.emptyCard, jellyShadow, { backgroundColor: meta.soft }]}>
          <View style={[styles.emptyIcon, { backgroundColor: meta.color }]}>
            <Ionicons name={meta.icon} size={26} color={colors.textInverse} />
          </View>
          <Text style={styles.emptyTitle}>{meta.emptyTitle}</Text>
          <Text style={styles.emptyBody}>{meta.emptyBody}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              kind={kind}
              icon={meta.icon}
              color={meta.color}
              soft={meta.soft}
              canEdit={canEdit}
              onEdit={() => setFormState({ mode: 'edit', booking })}
              onDelete={() => confirmDelete(booking)}
            />
          ))}
        </View>
      )}

      {canEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add booking"
          onPress={() => setFormState({ mode: 'create' })}
          style={({ pressed }) => [
            styles.addButton,
            jellyShadow,
            pressed && styles.addButtonPressed,
          ]}
        >
          <LinearGradient
            colors={meta.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButtonFill}
          >
            <Ionicons name="add-circle" size={20} color={colors.textInverse} />
            <Text style={styles.addButtonLabel}>Add booking</Text>
          </LinearGradient>
        </Pressable>
      ) : null}

      <BookingFormModal
        visible={formState !== null}
        kind={formState?.mode === 'edit' ? formState.booking.kind : kind}
        mode={formState?.mode ?? 'create'}
        initialValue={formState?.mode === 'edit' ? formState.booking : undefined}
        onSubmit={handleSubmit}
        onClose={() => setFormState(null)}
        isPending={isSaving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  list: { marginBottom: spacing.lg },
  emptyCard: {
    borderRadius: radii.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  emptyBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  addButton: { borderRadius: radii.pill, overflow: 'hidden' },
  addButtonPressed: { opacity: 0.9 },
  addButtonFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  addButtonLabel: { fontSize: fontSize.md, fontWeight: '800', color: colors.textInverse },
});
