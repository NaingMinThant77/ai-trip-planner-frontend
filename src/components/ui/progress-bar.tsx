import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../../theme';

type Props = {
  /** 0-100. Clamped, so a bad value cannot overflow the track. */
  value: number;
  color?: string;
  height?: number;
};

export function ProgressBar({ value, color = colors.brand, height = 6 }: Props) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={[styles.track, { height, borderRadius: height }]}
    >
      <View
        style={[styles.fill, { width: `${clamped}%`, backgroundColor: color, borderRadius: height }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill },
});
