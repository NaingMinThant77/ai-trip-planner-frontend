import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, gradients, radii, spacing } from '../../theme';
import { SaveResult, TripSummaryBlock } from '../../types/blocks';
import { SaveButton } from './save-button';

const MS_PER_DAY = 86_400_000;

export function TripSummaryBlockView({
  block,
  onSave,
  onOpenTrip,
}: {
  block: TripSummaryBlock;
  onSave?: () => Promise<SaveResult>;
  onOpenTrip?: (tripId: string) => void;
}) {
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const dayCount = Math.round((Date.parse(block.endDate) - Date.parse(block.startDate)) / MS_PER_DAY) + 1;

  return (
    <View style={styles.card}>
      <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerTop}>
          <Ionicons name="airplane" size={14} color={colors.textInverse} />
          <Text style={styles.eyebrow}>NEW TRIP PLAN</Text>
        </View>
        <Text style={styles.title}>{block.title}</Text>
        <Text style={styles.route}>
          {block.source ? `${block.source} → ` : ''}
          {block.destination}
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.facts}>
          <Fact icon="calendar-outline" text={`${formatDate(block.startDate)} – ${formatDate(block.endDate)}`} />
          <Fact icon="time-outline" text={`${dayCount} day${dayCount === 1 ? '' : 's'}`} />
          <Fact icon="people-outline" text={`${block.travelers} traveller${block.travelers === 1 ? '' : 's'}`} />
        </View>

        {block.summary ? <Text style={styles.summary}>{block.summary}</Text> : null}

        {block.highlights.length > 0 ? (
          <View style={styles.highlights}>
            {block.highlights.map((highlight) => (
              <View key={highlight} style={styles.highlightRow}>
                <Ionicons name="sparkles" size={12} color={colors.accent} />
                <Text style={styles.highlightText}>{highlight}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {block.days.length > 0 ? (
          <View style={styles.days}>
            {block.days.map((day) => (
              <View key={day.dayNumber} style={styles.dayRow}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>Day {day.dayNumber}</Text>
                </View>
                <View style={styles.dayBody}>
                  <Text style={styles.dayTitle}>{day.title}</Text>
                  {day.items.length > 0 ? (
                    <Text style={styles.dayItems} numberOfLines={2}>
                      {day.items.map((item) => item.title).join(' · ')}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {block.budgetText ? (
          <Text style={styles.budget}>Rough budget: {block.budgetText} — a guide, not a quote.</Text>
        ) : null}

        {onSave ? (
          <View style={styles.actions}>
            <SaveButton label="Save trip" onSave={onSave} onSaved={(result) => setSavedTripId(result.tripId)} />
            {savedTripId && onOpenTrip ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => onOpenTrip(savedTripId)}
                style={({ pressed }) => [styles.viewButton, pressed && styles.pressed]}
              >
                <Text style={styles.viewLabel}>View trip</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.textInverse} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Fact({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={13} color={colors.brandDark} />
      <Text style={styles.factText}>{text}</Text>
    </View>
  );
}

function formatDate(isoDate: string): string {
  // Parsed as UTC and printed as UTC so a trip date never slips a day with the device timezone.
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { padding: spacing.lg, gap: 2 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.textInverse, opacity: 0.85 },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.textInverse, marginTop: 4 },
  route: { fontSize: fontSize.sm, color: colors.textInverse, opacity: 0.9 },
  body: { padding: spacing.lg },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brandSoft,
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
  factText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.brandDark },
  summary: { marginTop: spacing.md, fontSize: fontSize.sm, lineHeight: 20, color: colors.text },
  highlights: { marginTop: spacing.md, gap: 6 },
  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  highlightText: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  days: { marginTop: spacing.md, gap: spacing.sm },
  dayRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  dayBadge: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    minWidth: 52,
    alignItems: 'center',
  },
  dayBadgeText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  dayBody: { flex: 1 },
  dayTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  dayItems: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  budget: { marginTop: spacing.md, fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic' },
  actions: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, flexWrap: 'wrap' },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.brand,
  },
  viewLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textInverse },
  pressed: { opacity: 0.75 },
});
