import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../api/client';
import {
  useBookingSearch,
  useDeleteBooking,
  useSaveBooking,
  useSavedBookings,
} from '../../hooks/use-bookings';
import { colors, fontSize, radii, spacing } from '../../theme';
import { BOOKING_KINDS, BookingKind, BookingOffer } from '../../types/api';
import { Button } from '../ui/button';
import { Chip } from '../ui/chip';

const KIND_LABEL: Record<BookingKind, string> = {
  hotel: 'Hotels',
  car: 'Car hire',
  flight: 'Flights',
};

export function BookingsSection({ tripId }: { tripId: string }) {
  const [kind, setKind] = useState<BookingKind>('hotel');

  const search = useBookingSearch(tripId, kind, true);
  const saved = useSavedBookings(tripId);
  const saveBooking = useSaveBooking(tripId);
  const deleteBooking = useDeleteBooking(tripId);

  function handleSave(offer: BookingOffer): void {
    saveBooking.mutate(offer, {
      onError: (error) =>
        Alert.alert(
          'Could not save',
          error instanceof ApiError ? error.message : 'Please try again.',
        ),
    });
  }

  return (
    <View>
      {/* This disclaimer is a product requirement, not decoration — see 01-product.md. */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Reference information only</Text>
        <Text style={styles.disclaimerBody}>
          These are indicative examples to help you plan and budget. Nothing here is live
          availability, a quote, or a reservation. Book with the supplier directly.
        </Text>
      </View>

      <View style={styles.tabs}>
        {BOOKING_KINDS.map((option) => (
          <Chip
            key={option}
            label={KIND_LABEL[option]}
            isSelected={kind === option}
            onPress={() => setKind(option)}
          />
        ))}
      </View>

      {saved.data && saved.data.length > 0 ? (
        <View style={styles.savedBlock}>
          <Text style={styles.sectionTitle}>Saved for this trip</Text>
          {saved.data.map((booking) => (
            <View key={booking.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{booking.title}</Text>
                {booking.priceText ? (
                  <Text style={styles.price}>{booking.priceText}</Text>
                ) : null}
              </View>
              {booking.detail ? <Text style={styles.detail}>{booking.detail}</Text> : null}
              <Button
                label="Remove"
                variant="secondary"
                onPress={() => deleteBooking.mutate(booking.id)}
                style={styles.cardAction}
              />
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>{KIND_LABEL[kind]}</Text>

      {search.isPending ? (
        <Text style={styles.hint}>Looking up options…</Text>
      ) : search.isError ? (
        <Text style={styles.hint}>
          {search.error instanceof ApiError ? search.error.message : 'Could not load options.'}
        </Text>
      ) : search.data.length === 0 ? (
        <Text style={styles.hint}>No options to show for this trip.</Text>
      ) : (
        search.data.map((offer) => (
          <View key={offer.externalId} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{offer.title}</Text>
              {offer.priceText ? <Text style={styles.price}>{offer.priceText}</Text> : null}
            </View>

            <Text style={styles.detail}>{offer.detail}</Text>

            <View style={styles.cardFooter}>
              <Text style={styles.provider}>
                {offer.provider}
                {offer.isIndicative ? ' · indicative' : ''}
              </Text>
            </View>

            <Button
              label="Save to trip"
              variant="secondary"
              onPress={() => handleSave(offer)}
              isLoading={saveBooking.isPending && saveBooking.variables?.externalId === offer.externalId}
              style={styles.cardAction}
            />
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  disclaimer: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  disclaimerTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primaryDark },
  disclaimerBody: {
    fontSize: fontSize.xs,
    color: colors.primaryDark,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  savedBlock: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  cardTitle: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  price: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primaryDark },
  detail: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 18, marginTop: spacing.xs },
  cardFooter: { marginTop: spacing.sm },
  provider: { fontSize: fontSize.xs, color: colors.textMuted },
  cardAction: { marginTop: spacing.md },
  hint: { fontSize: fontSize.sm, color: colors.textMuted },
});
