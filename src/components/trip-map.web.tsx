import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../theme';

export type MapPin = {
  label: string;
  latitude: number;
  longitude: number;
};

/**
 * Web counterpart to `trip-map.tsx`. react-native-maps has no web build, so rather than
 * shipping a broken map this lists the same pins as text — the information is still there.
 */
export function TripMap({ pins, height = 220 }: { pins: MapPin[]; height?: number }) {
  if (pins.length === 0) return null;

  return (
    <View style={[styles.wrapper, { minHeight: height }]}>
      <Text style={styles.notice}>Map view is available in the mobile app.</Text>
      {pins.map((pin, index) => (
        <Text key={`${pin.label}-${index}`} style={styles.pin}>
          {pin.label}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  notice: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.sm },
  pin: { fontSize: fontSize.sm, color: colors.text },
});
