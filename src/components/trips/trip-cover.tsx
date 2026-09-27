import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fontSize, tripCoverGradient } from '../../theme';

type Props = {
  /** Hashed for the fallback gradient, so one trip always looks the same. */
  seed: string;
  imageUrl?: string | null;
  /** Overlaid on the gradient fallback only — a real photo needs no letter. */
  label: string;
  /** Both branches render it, so it has to satisfy an image and a view alike. */
  style: ViewStyle & ImageStyle;
};

/** A trip's picture, or an honest stand-in for it. `coverImageUrl` is not populated yet. */
export function TripCover({ seed, imageUrl, label, style }: Props) {
  if (imageUrl) {
    return (
      <Image source={{ uri: imageUrl }} style={style} contentFit="cover" transition={150} />
    );
  }

  return (
    <LinearGradient
      colors={tripCoverGradient(seed)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[style, styles.fallback]}
    >
      <View style={styles.scrim} />
      <Text style={styles.letter}>{label.trim().charAt(0).toUpperCase() || '?'}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.08)' },
  letter: {
    color: colors.textInverse,
    fontSize: fontSize.xl,
    fontWeight: '700',
    opacity: 0.9,
  },
});
