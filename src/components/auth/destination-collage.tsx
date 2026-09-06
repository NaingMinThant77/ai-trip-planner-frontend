import { Image } from "expo-image";
import { useState } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { colors, radii, spacing } from "../../theme";

/**
 * Decorative only — remote sample photography standing in until the Explore destinations
 * carry their own `heroImageUrl`. Nothing here is a real destination recommendation.
 */
const TILES = [
  "photo-1502602898657-3e91760cbb34",
  "photo-1449824913935-59a10b8d2000",
  "photo-1506905925346-21bda4d32df4",
  "photo-1512453979798-5ea266f8880c",
  "photo-1444723121867-7a241cacace9",
  "photo-1519681393784-d120267933ba",
  "photo-1493246507139-91e8fad9978e",
  "photo-1533105079780-92b9be482077",
  "photo-1470071459604-3b5ec3a7fe05",
  "photo-1538332576228-eb5b4c4de6f5",
  "photo-1524850011238-e3d235c7d4c9",
  "photo-1476514525535-07fb3b4ae5f1",
];

const TILES_PER_PAGE = 3;
const COLUMNS = 3;
const TILE_ASPECT = 0.86;

const PAGES: string[][] = [];
for (let index = 0; index < TILES.length; index += TILES_PER_PAGE) {
  PAGES.push(TILES.slice(index, index + TILES_PER_PAGE));
}

function tileUri(id: string): string {
  return `https://images.unsplash.com/${id}?w=400&q=70&auto=format&fit=crop`;
}

export function DestinationCollage() {
  const [pageWidth, setPageWidth] = useState(0);
  const [page, setPage] = useState(0);

  function handleLayout(event: LayoutChangeEvent): void {
    setPageWidth(event.nativeEvent.layout.width);
  }

  function handleScrollEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ): void {
    if (pageWidth === 0) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    if (next !== page) setPage(next);
  }

  const tileWidth =
    pageWidth > 0 ? (pageWidth - spacing.md * (COLUMNS - 1)) / COLUMNS : 0;

  return (
    <View onLayout={handleLayout}>
      {pageWidth > 0 ? (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
          >
            {PAGES.map((tiles, pageIndex) => (
              <View key={pageIndex} style={[styles.page, { width: pageWidth }]}>
                {tiles.map((id) => (
                  <Image
                    key={id}
                    source={{ uri: tileUri(id) }}
                    style={[
                      styles.tile,
                      { width: tileWidth, height: tileWidth / TILE_ASPECT },
                    ]}
                    contentFit="cover"
                    transition={200}
                  />
                ))}
              </View>
            ))}
          </ScrollView>

          <View style={styles.dots}>
            {PAGES.map((_, dotIndex) => (
              <View
                key={dotIndex}
                style={[styles.dot, dotIndex === page && styles.dotActive]}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  tile: {
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceAlt,
  },
  dots: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  dot: {
    width: 8,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.brand,
  },
});
