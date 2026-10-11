import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  formatDay,
  formatDuration,
  formatTime,
  hostOf,
  nightsBetween,
  normalizeUrl,
  parseDetail,
  parseLocation,
  parseWallClock,
  WallClock,
} from '../lib/booking-format';
import { colors, fontSize, jellyShadow, jellyShadowSmall, radii, spacing } from '../theme';
import { BookingKind, SavedBooking } from '../types/api';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  booking: SavedBooking;
  kind: BookingKind;
  icon: IconName;
  color: string;
  soft: string;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

const RANGE_LABELS: Record<BookingKind, [string, string]> = {
  flight: ['Departs', 'Arrives'],
  car: ['Pickup', 'Drop-off'],
  hotel: ['Check-in', 'Check-out'],
  extra: ['When', ''],
};

async function openLink(url: string): Promise<void> {
  try {
    await Linking.openURL(normalizeUrl(url));
  } catch {
    Alert.alert('Could not open link', url);
  }
}

export function BookingCard({ booking, kind, icon, color, soft, canEdit, onEdit, onDelete }: Props) {
  const start = parseWallClock(booking.startsAt);
  const end = parseWallClock(booking.endsAt);
  const detail = parseDetail(booking.detail);
  const places = parseLocation(booking.location);
  const showTime = kind !== 'hotel';
  const [startLabel, endLabel] = RANGE_LABELS[kind];

  const middle =
    kind === 'hotel'
      ? nightsBetween(start, end)
        ? `${nightsBetween(start, end)} ${nightsBetween(start, end) === 1 ? 'night' : 'nights'}`
        : null
      : formatDuration(start, end);

  const chips: { icon: IconName; label: string }[] = [];
  if (detail.headline) chips.push({ icon: 'airplane-outline', label: detail.headline });
  if (detail.seat) chips.push({ icon: 'person-outline', label: `${/[,;&/\s]/.test(detail.seat) ? 'Seats' : 'Seat'} ${detail.seat}` });
  if (detail.room) chips.push({ icon: 'bed-outline', label: detail.room });

  return (
    <View style={[styles.card, jellyShadow]}>
      <View style={[styles.accent, { backgroundColor: color }]} />

      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color={colors.textInverse} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {booking.title}
          </Text>
          {booking.provider && booking.provider !== booking.title ? (
            <Text style={styles.provider} numberOfLines={1}>
              {booking.provider}
            </Text>
          ) : null}
        </View>
        {booking.priceText ? (
          <View style={[styles.pricePill, { backgroundColor: soft }]}>
            <Text style={[styles.price, { color }]}>{booking.priceText}</Text>
          </View>
        ) : null}
      </View>

      {start && end ? (
        <View style={[styles.range, { backgroundColor: soft }]}>
          <DateBlock label={startLabel} value={start} showTime={showTime} align="left" />
          <View style={styles.rangeMiddle}>
            <View style={styles.rangeLine}>
              <View style={[styles.rangeDash, { backgroundColor: color }]} />
              <Ionicons name={kind === 'flight' ? 'airplane' : 'arrow-forward'} size={16} color={color} />
              <View style={[styles.rangeDash, { backgroundColor: color }]} />
            </View>
            {middle ? <Text style={[styles.rangeCaption, { color }]}>{middle}</Text> : null}
          </View>
          <DateBlock label={endLabel} value={end} showTime={showTime} align="right" />
        </View>
      ) : start ? (
        <View style={[styles.range, { backgroundColor: soft }]}>
          <DateBlock label={startLabel} value={start} showTime={showTime} align="left" />
        </View>
      ) : null}

      {places.pickup || places.dropoff || places.plain ? (
        <View style={styles.places}>
          {places.plain ? <PlaceRow icon="location" color={color} value={places.plain} /> : null}
          {places.pickup ? (
            <PlaceRow icon="arrow-up-circle" color={color} label="Pickup" value={places.pickup} />
          ) : null}
          {places.dropoff ? (
            <PlaceRow icon="arrow-down-circle" color={color} label="Drop-off" value={places.dropoff} />
          ) : null}
        </View>
      ) : null}

      {chips.length > 0 || detail.confirmation ? (
        <View style={styles.chips}>
          {chips.map((chip) => (
            <View key={chip.label} style={styles.chip}>
              <Ionicons name={chip.icon} size={13} color={colors.textMuted} />
              <Text style={styles.chipLabel}>{chip.label}</Text>
            </View>
          ))}
          {detail.confirmation ? (
            <View style={[styles.chip, styles.codeChip, { borderColor: color }]}>
              <Text style={[styles.codeCaption, { color }]}>CODE</Text>
              <Text selectable style={styles.codeValue}>
                {detail.confirmation}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {detail.other.map((line) => (
        <Text key={line} style={styles.other}>
          {line}
        </Text>
      ))}

      {detail.notes ? (
        <View style={styles.notes}>
          <Ionicons name="document-text-outline" size={15} color={colors.textMuted} />
          <Text style={styles.notesText}>{detail.notes}</Text>
        </View>
      ) : null}

      {booking.externalUrl || canEdit ? (
        <View style={styles.footer}>
          {booking.externalUrl ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Open ${hostOf(booking.externalUrl)}`}
              onPress={() => void openLink(booking.externalUrl as string)}
              style={({ pressed }) => [styles.link, { backgroundColor: soft }, pressed && styles.pressed]}
            >
              <Ionicons name="open-outline" size={15} color={color} />
              <Text style={[styles.linkLabel, { color }]} numberOfLines={1}>
                {hostOf(booking.externalUrl)}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.spacer} />
          )}

          {canEdit ? (
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit booking"
                onPress={onEdit}
                style={[styles.iconButton, jellyShadowSmall, { backgroundColor: soft }]}
              >
                <Ionicons name="pencil" size={15} color={color} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete booking"
                onPress={onDelete}
                style={[styles.iconButton, jellyShadowSmall, styles.deleteButton]}
              >
                <Ionicons name="trash" size={15} color={colors.danger} />
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function PlaceRow({
  icon,
  color,
  label,
  value,
}: {
  icon: IconName;
  color: string;
  label?: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={17} color={color} />
      <View style={styles.placeText}>
        {label ? <Text style={styles.placeLabel}>{label}</Text> : null}
        <Text style={styles.infoText}>{value}</Text>
      </View>
    </View>
  );
}

function DateBlock({
  label,
  value,
  showTime,
  align,
}: {
  label: string;
  value: WallClock;
  showTime: boolean;
  align: 'left' | 'right';
}) {
  const textAlign = align === 'right' ? 'right' : 'left';
  return (
    <View style={[styles.dateBlock, { alignItems: align === 'right' ? 'flex-end' : 'flex-start' }]}>
      {label ? <Text style={[styles.dateLabel, { textAlign }]}>{label}</Text> : null}
      {showTime ? <Text style={[styles.dateTime, { textAlign }]}>{formatTime(value)}</Text> : null}
      <Text style={[showTime ? styles.dateDay : styles.dateTime, { textAlign }]}>{formatDay(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.lg,
    paddingTop: spacing.lg + 4,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  provider: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  pricePill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill },
  price: { fontSize: fontSize.sm, fontWeight: '800' },

  range: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  dateBlock: { flexShrink: 1, minWidth: 84 },
  dateLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  dateTime: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginTop: 2 },
  dateDay: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  rangeMiddle: { flex: 1, alignItems: 'center' },
  rangeLine: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'stretch' },
  rangeDash: { flex: 1, height: 2, borderRadius: 1, opacity: 0.35 },
  rangeCaption: { fontSize: 11, fontWeight: '700', marginTop: 4 },

  places: { marginTop: spacing.xs },
  placeText: { flex: 1 },
  placeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.md },
  infoText: { fontSize: fontSize.sm, color: colors.text },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  chipLabel: { fontSize: fontSize.xs, fontWeight: '600', color: colors.text },
  codeChip: { backgroundColor: colors.background, borderWidth: 1, borderStyle: 'dashed' },
  codeCaption: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  codeValue: { fontSize: fontSize.xs, fontWeight: '800', color: colors.text, letterSpacing: 0.8 },

  other: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 18, marginTop: spacing.sm },
  notes: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  notesText: { flex: 1, fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 18 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  spacer: { flex: 1 },
  link: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  linkLabel: { flexShrink: 1, fontSize: fontSize.xs, fontWeight: '700' },
  pressed: { opacity: 0.6 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: { backgroundColor: colors.dangerSoft },
});
