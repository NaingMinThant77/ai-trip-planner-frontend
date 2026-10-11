import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ComponentProps, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { parseDetail, parseLocation } from '../lib/booking-format';
import { colors, fontSize, jellyColors, jellyGradients, jellyShadow, radii, spacing } from '../theme';
import { BookingKind, SavedBooking, SaveBookingInput } from '../types/api';
import { GradientButton } from './ui/gradient-button';
import { DateTimeField, isEarlier } from './ui/date-time-field';
import { TextField } from './ui/text-field';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  visible: boolean;
  kind: BookingKind;
  mode: 'create' | 'edit';
  initialValue?: SavedBooking;
  onSubmit: (input: SaveBookingInput) => void;
  onClose: () => void;
  isPending?: boolean;
};

/**
 * All the free-text fields across every kind's form, kept in one object so a single reset
 * effect can repopulate whichever subset the current `kind` renders. Fields that map directly
 * onto a `SavedBooking` column (title/provider/location/startsAt/endsAt) round-trip cleanly on
 * edit; fields folded into the composed `detail` string on submit (flight number, seat,
 * confirmation codes, room type) do not — `detail` is one free-form string server-side, not
 * individually addressable, so those start blank on edit rather than attempting a fragile
 * regex round-trip. Extra's "Notes" is the one exception: it maps 1:1 onto `detail`, so it
 * does round-trip.
 */
type FormFields = {
  // flight
  airline: string;
  route: string;
  flightNumber: string;
  seat: string;
  departure: string;
  arrival: string;
  flightConfirmation: string;
  // car
  rentalCompany: string;
  pickupLocation: string;
  dropoffLocation: string;
  carType: string;
  pickupDate: string;
  dropoffDate: string;
  carConfirmation: string;
  // hotel
  hotelName: string;
  address: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  hotelConfirmation: string;
  // extra
  extraTitle: string;
  extraProvider: string;
  extraLocation: string;
  extraDateTime: string;
  notes: string;
  // common
  priceText: string;
  externalUrl: string;
};

const EMPTY_FIELDS: FormFields = {
  airline: '',
  route: '',
  flightNumber: '',
  seat: '',
  departure: '',
  arrival: '',
  flightConfirmation: '',
  rentalCompany: '',
  pickupLocation: '',
  dropoffLocation: '',
  carType: '',
  pickupDate: '',
  dropoffDate: '',
  carConfirmation: '',
  hotelName: '',
  address: '',
  checkIn: '',
  checkOut: '',
  roomType: '',
  hotelConfirmation: '',
  extraTitle: '',
  extraProvider: '',
  extraLocation: '',
  extraDateTime: '',
  notes: '',
  priceText: '',
  externalUrl: '',
};

const KIND_META: Record<
  BookingKind,
  { label: string; icon: IconName; color: string; gradient: readonly [string, string] }
> = {
  flight: { label: 'flight', icon: 'airplane', color: jellyColors.sky, gradient: jellyGradients.sky },
  car: { label: 'car', icon: 'car-sport', color: jellyColors.sun, gradient: jellyGradients.sun },
  hotel: { label: 'hotel', icon: 'bed', color: jellyColors.grape, gradient: jellyGradients.mint },
  extra: { label: 'extra', icon: 'ticket', color: jellyColors.berry, gradient: jellyGradients.berry },
};

function withNotes(lines: string[], notes: string): string | undefined {
  const trimmed = notes.trim();
  return [...lines, ...(trimmed ? [`Notes: ${trimmed}`] : [])].join('\n') || undefined;
}

/** Server timestamps come back as ISO; the pickers (and the stored format) use `YYYY-MM-DD HH:mm`. */
function toFieldValue(iso: string | null | undefined, dateOnly = false): string {
  if (!iso) return '';
  const day = iso.slice(0, 10);
  return dateOnly ? day : `${day} ${iso.slice(11, 16) || '00:00'}`;
}

function buildInitialFields(
  kind: BookingKind,
  mode: 'create' | 'edit',
  initialValue: SavedBooking | undefined,
): FormFields {
  if (mode !== 'edit' || !initialValue) return EMPTY_FIELDS;

  const parsed = parseDetail(initialValue.detail);
  const places = parseLocation(initialValue.location);
  const common = {
    notes: parsed.notes ?? '',
    priceText: initialValue.priceText ?? '',
    externalUrl: initialValue.externalUrl ?? '',
  };

  switch (kind) {
    case 'flight':
      return {
        ...EMPTY_FIELDS,
        ...common,
        airline: initialValue.provider ?? '',
        route: initialValue.title ?? '',
        flightNumber: parsed.headline ?? '',
        seat: parsed.seat ?? '',
        flightConfirmation: parsed.confirmation ?? '',
        departure: toFieldValue(initialValue.startsAt),
        arrival: toFieldValue(initialValue.endsAt),
      };
    case 'car':
      return {
        ...EMPTY_FIELDS,
        ...common,
        rentalCompany: initialValue.provider ?? '',
        carType: initialValue.title ?? '',
        pickupLocation: places.pickup ?? places.plain ?? '',
        dropoffLocation: places.dropoff ?? '',
        carConfirmation: parsed.confirmation ?? '',
        pickupDate: toFieldValue(initialValue.startsAt),
        dropoffDate: toFieldValue(initialValue.endsAt),
      };
    case 'hotel':
      return {
        ...EMPTY_FIELDS,
        ...common,
        hotelName: initialValue.title || initialValue.provider || '',
        address: initialValue.location ?? '',
        roomType: parsed.room ?? '',
        hotelConfirmation: parsed.confirmation ?? '',
        checkIn: toFieldValue(initialValue.startsAt, true),
        checkOut: toFieldValue(initialValue.endsAt, true),
      };
    case 'extra':
    default:
      return {
        ...EMPTY_FIELDS,
        ...common,
        extraTitle: initialValue.title ?? '',
        extraProvider: initialValue.provider ?? '',
        extraLocation: initialValue.location ?? '',
        extraDateTime: toFieldValue(initialValue.startsAt),
        notes: initialValue.detail ?? '',
      };
  }
}

function buildSubmitInput(kind: BookingKind, fields: FormFields): SaveBookingInput {
  const priceText = fields.priceText.trim() || undefined;
  const externalUrl = fields.externalUrl.trim() || undefined;

  switch (kind) {
    case 'flight': {
      const detailLines: string[] = [];
      if (fields.flightNumber.trim() || fields.seat.trim()) {
        detailLines.push(
          `Flight ${fields.flightNumber.trim()}${fields.seat.trim() ? ` · Seat ${fields.seat.trim()}` : ''}`.trim(),
        );
      }
      if (fields.flightConfirmation.trim()) {
        detailLines.push(`Confirmation: ${fields.flightConfirmation.trim()}`);
      }
      return {
        kind,
        title: fields.route.trim() || fields.airline.trim() || 'Flight',
        provider: fields.airline.trim(),
        priceText,
        startsAt: fields.departure.trim() || undefined,
        endsAt: fields.arrival.trim() || undefined,
        detail: withNotes(detailLines, fields.notes),
        externalUrl,
      };
    }
    case 'car': {
      const locationParts = [
        fields.pickupLocation.trim() ? `Pickup: ${fields.pickupLocation.trim()}` : '',
        fields.dropoffLocation.trim() ? `Drop-off: ${fields.dropoffLocation.trim()}` : '',
      ].filter(Boolean);
      const detailLines: string[] = [];
      if (fields.carConfirmation.trim()) detailLines.push(`Confirmation: ${fields.carConfirmation.trim()}`);
      return {
        kind,
        title: fields.carType.trim() || 'Car hire',
        provider: fields.rentalCompany.trim(),
        priceText,
        location: locationParts.join(' · ') || undefined,
        startsAt: fields.pickupDate.trim() || undefined,
        endsAt: fields.dropoffDate.trim() || undefined,
        detail: withNotes(detailLines, fields.notes),
        externalUrl,
      };
    }
    case 'hotel': {
      const name = fields.hotelName.trim();
      const detailLines: string[] = [];
      if (fields.roomType.trim()) detailLines.push(`Room: ${fields.roomType.trim()}`);
      if (fields.hotelConfirmation.trim()) {
        detailLines.push(`Confirmation: ${fields.hotelConfirmation.trim()}`);
      }
      return {
        kind,
        title: name,
        provider: name,
        priceText,
        location: fields.address.trim() || undefined,
        startsAt: fields.checkIn.trim() || undefined,
        endsAt: fields.checkOut.trim() || undefined,
        detail: withNotes(detailLines, fields.notes),
        externalUrl,
      };
    }
    case 'extra':
    default:
      return {
        kind,
        title: fields.extraTitle.trim(),
        provider: fields.extraProvider.trim(),
        priceText,
        location: fields.extraLocation.trim() || undefined,
        startsAt: fields.extraDateTime.trim() || undefined,
        detail: fields.notes.trim() || undefined,
        externalUrl,
      };
  }
}

const endsBeforeStart = (start: string, end: string): boolean =>
  Boolean(start) && Boolean(end) && isEarlier(end, start);

function isSubmittable(kind: BookingKind, fields: FormFields): boolean {
  switch (kind) {
    case 'flight':
      return fields.airline.trim().length > 0 && !endsBeforeStart(fields.departure, fields.arrival);
    case 'car':
      return (
        fields.rentalCompany.trim().length > 0 &&
        !endsBeforeStart(fields.pickupDate, fields.dropoffDate)
      );
    case 'hotel':
      return (
        fields.hotelName.trim().length > 0 && !endsBeforeStart(fields.checkIn, fields.checkOut)
      );
    case 'extra':
    default:
      return fields.extraTitle.trim().length > 0;
  }
}

export function BookingFormModal({
  visible,
  kind,
  mode,
  initialValue,
  onSubmit,
  onClose,
  isPending = false,
}: Props) {
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS);
  const meta = KIND_META[kind];

  useEffect(() => {
    if (!visible) return;
    setFields(buildInitialFields(kind, mode, initialValue));
  }, [visible, kind, mode, initialValue]);

  function set<K extends keyof FormFields>(key: K, value: string): void {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(): void {
    if (!isSubmittable(kind, fields)) return;
    onSubmit(buildSubmitInput(kind, fields));
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.avoider}
        >
          <View style={[styles.sheet, jellyShadow]}>
            <LinearGradient
              colors={meta.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerBand}
            >
              <View style={styles.headerIcon}>
                <Ionicons name={meta.icon} size={20} color={colors.textInverse} />
              </View>
              <Text style={styles.headerTitle}>
                {mode === 'create' ? 'Add' : 'Edit'} {meta.label}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                hitSlop={8}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={colors.textInverse} />
              </Pressable>
            </LinearGradient>

            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {kind === 'flight' ? (
                <>
                  <TextField
                    label="Airline / flight"
                    placeholder="e.g. Delta DL123"
                    value={fields.airline}
                    onChangeText={(value) => set('airline', value)}
                  />
                  <TextField
                    label="Route"
                    placeholder="e.g. JFK → CDG"
                    value={fields.route}
                    onChangeText={(value) => set('route', value)}
                  />
                  <View style={styles.row}>
                    <View style={styles.rowItem}>
                      <TextField
                        label="Flight number"
                        placeholder="DL123"
                        value={fields.flightNumber}
                        onChangeText={(value) => set('flightNumber', value)}
                      />
                    </View>
                    <View style={styles.rowItem}>
                      <TextField
                        label="Seats"
                        placeholder="14C, 14D"
                        value={fields.seat}
                        onChangeText={(value) => set('seat', value)}
                      />
                    </View>
                  </View>
                  <DateTimeField
                    label="Departure"
                    mode="datetime"
                    value={fields.departure}
                    onChange={(value) => set('departure', value)}
                  />
                  <DateTimeField
                    label="Arrival"
                    mode="datetime"
                    value={fields.arrival}
                    minimumValue={fields.departure}
                    minimumMessage="Arrival can’t be earlier than departure"
                    onChange={(value) => set('arrival', value)}
                  />
                  <TextField
                    label="Confirmation code"
                    placeholder="ABC123"
                    autoCapitalize="characters"
                    value={fields.flightConfirmation}
                    onChangeText={(value) => set('flightConfirmation', value)}
                  />
                  <TextField
                    label="Notes"
                    placeholder="Anything worth remembering"
                    value={fields.notes}
                    onChangeText={(value) => set('notes', value)}
                    multiline
                    numberOfLines={3}
                    style={styles.notesInput}
                  />
                </>
              ) : null}

              {kind === 'car' ? (
                <>
                  <TextField
                    label="Rental company"
                    placeholder="e.g. Hertz"
                    value={fields.rentalCompany}
                    onChangeText={(value) => set('rentalCompany', value)}
                  />
                  <TextField
                    label="Car type"
                    placeholder="e.g. Compact SUV"
                    value={fields.carType}
                    onChangeText={(value) => set('carType', value)}
                  />
                  <TextField
                    label="Pickup location"
                    placeholder="e.g. CDG Airport"
                    value={fields.pickupLocation}
                    onChangeText={(value) => set('pickupLocation', value)}
                  />
                  <TextField
                    label="Drop-off location"
                    placeholder="e.g. Gare de Lyon"
                    value={fields.dropoffLocation}
                    onChangeText={(value) => set('dropoffLocation', value)}
                  />
                  <DateTimeField
                    label="Pickup date"
                    mode="datetime"
                    value={fields.pickupDate}
                    onChange={(value) => set('pickupDate', value)}
                  />
                  <DateTimeField
                    label="Drop-off date"
                    mode="datetime"
                    value={fields.dropoffDate}
                    minimumValue={fields.pickupDate}
                    minimumMessage="Drop-off can’t be earlier than pickup"
                    onChange={(value) => set('dropoffDate', value)}
                  />
                  <TextField
                    label="Confirmation code"
                    placeholder="ABC123"
                    autoCapitalize="characters"
                    value={fields.carConfirmation}
                    onChangeText={(value) => set('carConfirmation', value)}
                  />
                  <TextField
                    label="Notes"
                    placeholder="Anything worth remembering"
                    value={fields.notes}
                    onChangeText={(value) => set('notes', value)}
                    multiline
                    numberOfLines={3}
                    style={styles.notesInput}
                  />
                </>
              ) : null}

              {kind === 'hotel' ? (
                <>
                  <TextField
                    label="Hotel name"
                    placeholder="e.g. Hotel Lutetia"
                    value={fields.hotelName}
                    onChangeText={(value) => set('hotelName', value)}
                  />
                  <TextField
                    label="Address"
                    placeholder="e.g. 45 Bd Raspail, Paris"
                    value={fields.address}
                    onChangeText={(value) => set('address', value)}
                  />
                  <View style={styles.row}>
                    <View style={styles.rowItem}>
                      <DateTimeField
                        label="Check-in"
                        mode="date"
                        value={fields.checkIn}
                        onChange={(value) => set('checkIn', value)}
                      />
                    </View>
                    <View style={styles.rowItem}>
                      <DateTimeField
                        label="Check-out"
                        mode="date"
                        value={fields.checkOut}
                    minimumValue={fields.checkIn}
                    minimumMessage="Check-out can’t be earlier than check-in"
                        onChange={(value) => set('checkOut', value)}
                      />
                    </View>
                  </View>
                  <TextField
                    label="Room type"
                    placeholder="e.g. Deluxe double"
                    value={fields.roomType}
                    onChangeText={(value) => set('roomType', value)}
                  />
                  <TextField
                    label="Confirmation code"
                    placeholder="ABC123"
                    autoCapitalize="characters"
                    value={fields.hotelConfirmation}
                    onChangeText={(value) => set('hotelConfirmation', value)}
                  />
                  <TextField
                    label="Notes"
                    placeholder="Anything worth remembering"
                    value={fields.notes}
                    onChangeText={(value) => set('notes', value)}
                    multiline
                    numberOfLines={3}
                    style={styles.notesInput}
                  />
                </>
              ) : null}

              {kind === 'extra' ? (
                <>
                  <TextField
                    label="Title"
                    placeholder="e.g. Louvre skip-the-line ticket"
                    value={fields.extraTitle}
                    onChangeText={(value) => set('extraTitle', value)}
                  />
                  <TextField
                    label="Provider"
                    placeholder="e.g. GetYourGuide"
                    value={fields.extraProvider}
                    onChangeText={(value) => set('extraProvider', value)}
                  />
                  <TextField
                    label="Location"
                    placeholder="e.g. Rue de Rivoli, Paris"
                    value={fields.extraLocation}
                    onChangeText={(value) => set('extraLocation', value)}
                  />
                  <DateTimeField
                    label="Date / time"
                    mode="datetime"
                    value={fields.extraDateTime}
                    onChange={(value) => set('extraDateTime', value)}
                  />
                  <TextField
                    label="Notes"
                    placeholder="Anything worth remembering"
                    value={fields.notes}
                    onChangeText={(value) => set('notes', value)}
                    multiline
                    numberOfLines={3}
                    style={styles.notesInput}
                  />
                </>
              ) : null}

              <TextField
                label="Price (optional)"
                placeholder="e.g. $180/night"
                value={fields.priceText}
                onChangeText={(value) => set('priceText', value)}
              />
              <TextField
                label="Link (optional)"
                placeholder="https://…"
                autoCapitalize="none"
                autoCorrect={false}
                value={fields.externalUrl}
                onChangeText={(value) => set('externalUrl', value)}
              />
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [styles.cancel, pressed && styles.cancelPressed]}
              >
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>

              <GradientButton
                label={mode === 'create' ? 'Save booking' : 'Save changes'}
                onPress={handleSubmit}
                isLoading={isPending}
                disabled={!isSubmittable(kind, fields)}
                gradientColors={meta.gradient}
                style={styles.submit}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  avoider: { width: '100%' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  headerBand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.textInverse,
    textTransform: 'capitalize',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.xl, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', gap: spacing.md },
  rowItem: { flex: 1 },
  notesInput: { minHeight: 72, textAlignVertical: 'top' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelPressed: { opacity: 0.6 },
  cancelLabel: { fontSize: fontSize.md, fontWeight: '600', color: colors.textMuted },
  submit: { flex: 1 },
});
