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

export const budgetTierLabel = {
  budget: 'Budget',
  mid: 'Mid-range',
  luxury: 'Luxury',
} as const;
