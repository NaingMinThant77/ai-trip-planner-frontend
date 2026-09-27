/** The only place colors, spacing and radii are defined. No hex literals in screens. */

export const colors = {
  background: '#FFFFFF',
  surface: '#F6F7F9',
  surfaceAlt: '#EEF1F5',
  border: '#E2E6EC',
  text: '#111827',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primarySoft: '#DBEAFE',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#059669',
  warning: '#D97706',

  // Brand teal. Currently used by the auth + onboarding screens only; the rest of the app
  // is still on `primary` blue and gets migrated screen by screen.
  brand: '#0E8A7D',
  brandDark: '#0B5F58',
  brandSoft: '#D7EFEB',
  googleBlue: '#4285F4',

  // Soft tinted grounds for icon tiles and highlight cards on the redesigned screens.
  accent: '#E07A3F',
  accentSoft: '#FDEEE2',
  infoSoft: '#E4EDFB',
  info: '#3B82F6',
  overlay: 'rgba(15, 23, 42, 0.28)',
} as const;

/** Multi-stop gradients. Tuples so `LinearGradient`'s readonly string[] prop is satisfied. */
export const gradients = {
  brand: ['#0F9C86', '#0B6A62'],
  photoScrim: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.35)'],
  /** The teal-to-blue summary banner on My trips. */
  summary: ['#0F9C86', '#12798F'],
} as const;

/**
 * Stand-ins for a trip photo, used when `Trip.coverImageUrl` is null (older trips created
 * before covers existed, or a failed upload/generation). Picked by hashing the trip id, so
 * a given trip always gets the same one and a list of cards is not monochrome.
 */
export const tripCoverGradients = [
  ['#0EA5A0', '#0B6A62'],
  ['#3B82F6', '#1E3A8A'],
  ['#F59E0B', '#B45309'],
  ['#8B5CF6', '#5B21B6'],
  ['#EC4899', '#9D174D'],
  ['#14B8A6', '#0F766E'],
] as const;

export function tripCoverGradient(seed: string): readonly [string, string] {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100_000;
  }
  return tripCoverGradients[hash % tripCoverGradients.length];
}

/**
 * "Jelly" look for the Trip Detail screen redesign (itinerary/bookings/packing/photos +
 * the share popup). Kept separate from `colors`/`gradients` above rather than expanding them,
 * per the one-screen-at-a-time migration rule — only Trip Detail's components should reach
 * for these.
 */
export const jellyColors = {
  mint: '#12B886',
  mintSoft: '#DFF7EE',
  sky: '#3D9EF0',
  skySoft: '#E1F0FE',
  sun: '#F5A623',
  sunSoft: '#FDECC8',
  berry: '#E85D8C',
  berrySoft: '#FCE1EC',
  grape: '#8B6BE0',
  grapeSoft: '#EBE3FC',
} as const;

export const jellyGradients = {
  mint: ['#1FCB9B', '#0E9C74'],
  sky: ['#57B2FF', '#2E7FE0'],
  sun: ['#FFC55C', '#F0932B'],
  berry: ['#FF7FAB', '#E24F82'],
} as const;

/**
 * A soft, oversized shadow that reads as "squishy" rather than the flat 1px borders used
 * elsewhere in the app. Spread across a plain object so it lands on both platforms —
 * `elevation` is the Android equivalent of the iOS shadow props.
 */
export const jellyShadow = {
  shadowColor: '#1F2A44',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.12,
  shadowRadius: 20,
  elevation: 6,
} as const;

export const jellyShadowSmall = {
  shadowColor: '#1F2A44',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 3,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

/**
 * The tab bar floats over the content, so a scrolling screen inside `(tabs)` has to reserve
 * room for it or its last row sits under the bar. Use `layout.tabBarClearance` as
 * `paddingBottom` on those scroll containers.
 */
export const layout = {
  tabBarHeight: 66,
  tabBarClearance: 108,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 30,
} as const;

export const timeOfDayLabel = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
} as const;
