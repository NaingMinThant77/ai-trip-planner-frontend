import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../theme';

export type MapPin = {
  label: string;
  latitude: number;
  longitude: number;
};

/**
 * Native map. `trip-map.web.tsx` is the web counterpart — react-native-maps has no web build,
 * and Metro picks the platform file automatically.
 *
 * Android needs a Google Maps API key for a standalone build; Expo Go supplies its own.
 * See memory/08-environment.md.
 */
export function TripMap({ pins, height = 220 }: { pins: MapPin[]; height?: number }) {
  if (pins.length === 0) return null;

  return (
    <View style={[styles.wrapper, { height }]}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={regionFor(pins)}>
        {pins.map((pin, index) => (
          <Marker
            key={`${pin.label}-${index}`}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            title={pin.label}
          />
        ))}
      </MapView>
    </View>
  );
}

/**
 * Frames all pins with padding. A single pin has no spread, so a fixed delta is used —
 * otherwise the map zooms to maximum and shows a featureless square.
 */
function regionFor(pins: MapPin[]) {
  const lats = pins.map((p) => p.latitude);
  const lngs = pins.map((p) => p.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.05),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.05),
  };
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
