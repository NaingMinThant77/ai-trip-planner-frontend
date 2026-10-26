import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Destination, Suggestion, TrendingDestination } from '../../types/api';
import {
  colors,
  fontSize,
  gradients,
  jellyShadowSmall,
  radii,
  spacing,
  tripCoverGradient,
} from '../../theme';

type Props = {
  picks: Suggestion[];
  inSeason: Destination[];
  trending: TrendingDestination[];
  /** The whole catalogue — feeds the interest chips and the region tiles. */
  destinations: Destination[];
  onOpen: (destination: Destination) => void;
  onSearch: () => void;
  onRegion: (region: string) => void;
};

const INTEREST_LIMIT = 8;
const INTEREST_RESULTS = 8;

/**
 * The Explore tab on Home, top to bottom: search, trending (top 3), best time to go, browse by
 * interest, browse by region, then picks for the signed-in traveller.
 */
export function ExploreSections({
  picks,
  inSeason,
  trending,
  destinations,
  onOpen,
  onSearch,
  onRegion,
}: Props) {
  const monthName = new Date().toLocaleString('en-US', { month: 'long' });
  const [interest, setInterest] = useState('');

  const interests = useMemo(() => topTags(destinations), [destinations]);
  const regions = useMemo(() => groupByRegion(destinations), [destinations]);
  const byInterest = useMemo(
    () =>
      (interest ? destinations.filter((d) => d.tags.includes(interest)) : destinations).slice(
        0,
        INTEREST_RESULTS,
      ),
    [destinations, interest],
  );

  return (
    <View>
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search destinations"
        onPress={onSearch}
        style={({ pressed }) => [styles.search, pressed && styles.pressed]}
      >
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <Text style={styles.searchText}>Where to next? Search places</Text>
      </Pressable>

      {trending.length > 0 ? (
        <>
          <SectionTitle title="Trending now" icon="flame-outline" />
          {trending.map((destination, index) => (
            <Backdrop
              key={destination.id}
              destination={destination}
              onPress={() => onOpen(destination)}
              style={styles.feature}
              fullWidth
            >
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1} trending</Text>
              </View>
              <Text style={styles.heroName}>{destination.name}</Text>
              <Text style={styles.heroCountry}>{destination.country}</Text>
              <Text style={styles.heroReason} numberOfLines={2}>
                {destination.summary}
              </Text>
              <Text style={styles.readMore}>Read the guide →</Text>
            </Backdrop>
          ))}
        </>
      ) : null}

      {inSeason.length > 0 ? (
        <>
          <SectionTitle
            title="Best time to go"
            icon="sunny-outline"
            hint={`In season · ${monthName}`}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed}>
            {inSeason.map((destination) => (
              <Backdrop
                key={destination.id}
                destination={destination}
                onPress={() => onOpen(destination)}
                style={styles.season}
              >
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Perfect in {monthName}</Text>
                </View>
                <Text style={styles.seasonName}>{destination.name}</Text>
                <Text style={styles.seasonCountry}>{destination.country}</Text>
              </Backdrop>
            ))}
          </ScrollView>
        </>
      ) : null}

      {destinations.length > 0 ? (
        <>
          <SectionTitle title="Explore by interest" icon="compass-outline" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed}>
            <InterestChip label="All" selected={interest === ''} onPress={() => setInterest('')} />
            {interests.map((tag) => (
              <InterestChip
                key={tag}
                label={capitalise(tag)}
                selected={interest === tag}
                onPress={() => setInterest(interest === tag ? '' : tag)}
              />
            ))}
          </ScrollView>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.bleed, styles.interestList]}
          >
            {byInterest.map((destination) => (
              <Backdrop
                key={destination.id}
                destination={destination}
                onPress={() => onOpen(destination)}
                style={styles.season}
              >
                <Text style={styles.seasonName}>{destination.name}</Text>
                <Text style={styles.seasonCountry}>{destination.country}</Text>
              </Backdrop>
            ))}
          </ScrollView>

          <SectionTitle title="Explore by region" icon="globe-outline" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed}>
            {regions.map((region) => (
              <Pressable
                key={region.name}
                accessibilityRole="button"
                accessibilityLabel={`${region.name}, ${region.count} places`}
                onPress={() => onRegion(region.name)}
                style={({ pressed }) => [styles.cardWrap, pressed && styles.pressed]}
              >
                <LinearGradient
                  colors={tripCoverGradient(region.name)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.region}
                >
                  <Text style={styles.regionName}>{region.name}</Text>
                  <Text style={styles.regionCount}>
                    {region.count} {region.count === 1 ? 'place' : 'places'}
                  </Text>
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

      {picks.length > 0 ? (
        <>
          <SectionTitle title="Picked for you" icon="sparkles-outline" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed}>
            {picks.map((pick) => (
              <Backdrop
                key={pick.id}
                destination={pick}
                onPress={() => onOpen(pick)}
                style={styles.hero}
              >
                <Text style={styles.heroName}>{pick.name}</Text>
                <Text style={styles.heroCountry}>{pick.country}</Text>
                <Text style={styles.heroReason} numberOfLines={2}>
                  {pick.reason}
                </Text>
              </Backdrop>
            ))}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}

function topTags(destinations: Destination[]): string[] {
  const counts = new Map<string, number>();
  for (const destination of destinations) {
    for (const tag of destination.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, INTEREST_LIMIT)
    .map(([tag]) => tag);
}

function groupByRegion(destinations: Destination[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const destination of destinations) {
    counts.set(destination.region, (counts.get(destination.region) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function InterestChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function SectionTitle({
  title,
  icon,
  hint,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  hint?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={colors.brand} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

/**
 * A destination's picture, or a gradient hashed from its slug while `heroImageUrl` is empty.
 * With children and `onPress` it is a tappable card with a scrim so white text stays legible.
 */
function Backdrop({
  destination,
  onPress,
  style,
  children,
  fullWidth = false,
}: {
  destination: Destination;
  onPress?: () => void;
  style: object;
  children?: React.ReactNode;
  /** Stacked card in a column rather than one in a horizontal carousel. */
  fullWidth?: boolean;
}) {
  const content = (
    <>
      {destination.heroImageUrl ? (
        <Image
          source={{ uri: destination.heroImageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
        />
      ) : null}
      {children ? (
        <LinearGradient
          colors={gradients.photoScrim}
          style={[StyleSheet.absoluteFill, styles.scrim]}
          pointerEvents="none"
        />
      ) : null}
      {children ? <View style={styles.cardContent}>{children}</View> : null}
    </>
  );

  const container = [style, styles.clip];

  const gradient = (
    <LinearGradient
      colors={tripCoverGradient(destination.slug)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={container}
    >
      {content}
    </LinearGradient>
  );

  if (!onPress) return gradient;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={destination.name}
      onPress={onPress}
      style={({ pressed }) => [
        fullWidth ? styles.fullWrap : styles.cardWrap,
        pressed && styles.pressed,
      ]}
    >
      {gradient}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
  },
  searchText: { fontSize: fontSize.sm, color: colors.textMuted },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.brand },
  chipLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
  chipLabelSelected: { color: colors.textInverse },
  interestList: { marginTop: spacing.md },
  region: {
    width: 140,
    height: 90,
    borderRadius: radii.xl,
    padding: spacing.md,
    justifyContent: 'flex-end',
  },
  regionName: { fontSize: fontSize.md, fontWeight: '800', color: colors.textInverse },
  regionCount: { fontSize: fontSize.xs, color: colors.textInverse, opacity: 0.9 },
  bleed: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  sectionHint: { marginLeft: 'auto', fontSize: fontSize.xs, color: colors.textMuted },
  pressed: { opacity: 0.8 },
  cardWrap: { marginRight: spacing.md },
  fullWrap: { marginBottom: spacing.md },
  clip: { overflow: 'hidden' },
  scrim: { top: '35%' },
  cardContent: { flex: 1, justifyContent: 'flex-end', padding: spacing.md },

  feature: { height: 210, borderRadius: radii.xl, ...jellyShadowSmall },
  rankBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  rankText: { fontSize: 11, fontWeight: '800', color: colors.textInverse },
  readMore: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textInverse,
    marginTop: spacing.sm,
  },
  hero: { width: 250, height: 170, borderRadius: radii.xl, ...jellyShadowSmall },
  heroName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.textInverse },
  heroCountry: { fontSize: fontSize.xs, color: colors.textInverse, opacity: 0.9 },
  heroReason: {
    fontSize: fontSize.xs,
    color: colors.textInverse,
    marginTop: spacing.xs,
    lineHeight: 16,
  },

  season: { width: 150, height: 190, borderRadius: radii.xl, ...jellyShadowSmall },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.brandDark },
  seasonName: { fontSize: fontSize.md, fontWeight: '800', color: colors.textInverse },
  seasonCountry: { fontSize: fontSize.xs, color: colors.textInverse, opacity: 0.9 },
});
