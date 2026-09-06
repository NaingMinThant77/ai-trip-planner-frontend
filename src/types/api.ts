/**
 * Hand-mirrored copy of the backend wire shapes.
 * Source of truth lives in the backend service files and `trip.mapper.ts`.
 * AGENTS.md rule 3: if you change one side, change this file in the same commit.
 */

export const BUDGET_TIERS = ['budget', 'mid', 'luxury'] as const;
export type BudgetTier = (typeof BUDGET_TIERS)[number];

export const PACKING_CATEGORIES = [
  'clothing',
  'documents',
  'electronics',
  'toiletries',
  'health',
  'other',
] as const;
export type PackingCategory = (typeof PACKING_CATEGORIES)[number];

export const BOOKING_KINDS = ['hotel', 'car', 'flight'] as const;
export type BookingKind = (typeof BOOKING_KINDS)[number];

export type TripStatus = 'draft' | 'generating' | 'ready' | 'failed';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type UserProfile = User & {
  homeCity: string | null;
  interests: string[];
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type Activity = {
  id: string;
  position: number;
  timeOfDay: TimeOfDay;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  durationMin: number;
  /** Model-produced text. Render as a hint, never as a confirmed price. */
  costEstimate: string | null;
};

export type TripDay = {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  summary: string;
  activities: Activity[];
};

export type Trip = {
  id: string;
  title: string;
  destination: string;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  endDate: string;
  travelers: number;
  budgetTier: BudgetTier;
  interests: string[];
  notes: string | null;
  status: TripStatus;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TripDetail = Trip & { days: TripDay[] };

export type CreateTripInput = {
  title?: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budgetTier: BudgetTier;
  interests: string[];
  notes?: string;
};

export type PackingItem = {
  id: string;
  label: string;
  category: PackingCategory;
  quantity: number;
  isPacked: boolean;
  source: 'ai' | 'user';
  position: number;
};

export type Photo = {
  id: string;
  /** Server-relative path. Join with API_BASE_ORIGIN before handing to <Image>. */
  url: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  uploadedBy: string;
};

export type BookingOffer = {
  externalId: string;
  kind: BookingKind;
  title: string;
  provider: string;
  priceText: string | null;
  location: string | null;
  startsAt: string | null;
  endsAt: string | null;
  detail: string;
  externalUrl: string | null;
  /** True for anything not from a live supplier. Drives the "indicative" warning. */
  isIndicative: boolean;
};

export type SavedBooking = {
  id: string;
  kind: BookingKind;
  title: string;
  provider: string;
  priceText: string | null;
  location: string | null;
  startsAt: string | null;
  endsAt: string | null;
  detail: string;
  externalUrl: string | null;
  createdAt: string;
};

export type ShareState = {
  isShared: boolean;
  shareToken: string | null;
  sharePath: string | null;
};

export type Collaborator = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  invitedAt: string;
};

export type Destination = {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string;
  summary: string;
  tags: string[];
  bestMonths: number[];
  heroImageUrl: string | null;
  latitude: number;
  longitude: number;
  dailyBudgetText: string | null;
};

export type Suggestion = Destination & {
  reason: string;
  score: number;
};
