import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';
import { TRIP_PHASE_LABEL, TripPhase } from '../../lib/trip-status';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TONE: Record<TripPhase, { background: string; text: string; icon: IconName }> = {
  upcoming: { background: colors.infoSoft, text: colors.info, icon: 'location-outline' },
  ongoing: { background: colors.brandSoft, text: colors.brandDark, icon: 'airplane-outline' },
  completed: { background: colors.surfaceAlt, text: colors.textMuted, icon: 'checkmark-circle-outline' },
};

export function StatusChip({ phase, size = 'md' }: { phase: TripPhase; size?: 'sm' | 'md' }) {
  const tone = TONE[phase];
  const isSmall = size === 'sm';

  return (
    <View style={[styles.chip, { backgroundColor: tone.background }, isSmall && styles.chipSmall]}>
      <Ionicons name={tone.icon} size={isSmall ? 11 : 13} color={tone.text} />
      <Text style={[styles.label, { color: tone.text }, isSmall && styles.labelSmall]}>
        {TRIP_PHASE_LABEL[phase]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipSmall: { paddingHorizontal: 6, paddingVertical: 3 },
  label: { fontSize: fontSize.xs, fontWeight: '700' },
  labelSmall: { fontSize: 10 },
});
