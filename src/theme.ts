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
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
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
