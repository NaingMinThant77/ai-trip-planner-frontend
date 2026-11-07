/**
 * Hand-mirrored copy of the backend wire shapes.
 * Source of truth lives in the backend service files and `trip.mapper.ts`.
 * AGENTS.md rule 3: if you change one side, change this file in the same commit.
 */

export const PACKING_CATEGORIES = [
  'clothing',
  'documents',
  'electronics',
  'toiletries',
  'health',
  'other',
] as const;
export type PackingCategory = (typeof PACKING_CATEGORIES)[number];

export const BOOKING_KINDS = ['hotel', 'car', 'flight', 'extra'] as const;
export type BookingKind = (typeof BOOKING_KINDS)[number];

export type TripStatus = 'draft' | 'generating' | 'ready' | 'failed';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export type User = {
  id: string;
  email: string;
  name: string;
  /** Cloudinary URL. Null means render initials instead. */
  avatarUrl: string | null;
  createdAt: string;
};

export type UserProfile = User & {
  homeCity: string | null;
  interests: string[];
  /** Minted by the server on first profile read, then stable. Shared so family can add you. */
  inviteCode: string;
  /** False for Google-only accounts, which set a first password instead of changing one. */
  hasPassword: boolean;
};

/** A direct message with a family member. */
export type Message = {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
  readAt: string | null;
};

/** Someone the signed-in user added by invite code. Mutual: appears in both people's lists. */
export type FamilyMember = {
  id: string;
  /** The added account's user id, not the row id. */
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  addedAt: string;
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
  /** "HH:mm" 24-hour. Null on generated stops, which only carry `timeOfDay`. */
  startTime: string | null;
  endTime: string | null;
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
  source: string;
  destination: string;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  endDate: string;
  travelers: number;
  notes: string | null;
  status: TripStatus;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Milestone-based, computed server-side from row counts. See 03-api-contract.md. */
export type TripPlanning = {
  /** 0-100, in steps of 25 — itinerary is worth 50, packing and bookings 25 each. */
  progress: number;
  hasItinerary: boolean;
  hasPacking: boolean;
  hasBookings: boolean;
};

/** What `GET /trips` returns. The detail route ships `days` instead. */
export type TripListItem = Trip & { planning: TripPlanning };

/** The caller's relationship to the trip — an owner has full access; a collaborator gets
 * whichever of these two roles they were given. */
export type ViewerRole = 'owner' | 'viewer' | 'editor';

export type TripDetail = Trip & { days: TripDay[]; viewerRole: ViewerRole };

export type CreateTripInput = {
  title?: string;
  source: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers?: number;
  coverImageUrl: string;
  coverImagePublicId?: string;
  notes?: string;
};

/** `PATCH /trips/:id`. Every field is optional; an omitted field is left as it is. */
export type UpdateTripInput = Partial<Omit<CreateTripInput, 'coverImageUrl'>> & {
  coverImageUrl?: string;
};

export type UploadedCoverImage = {
  url: string;
  publicId: string;
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

export type CreateActivityInput = {
  /** The server derives this (and `durationMin`) from the times when both are sent. */
  timeOfDay?: TimeOfDay;
  startTime?: string;
  endTime?: string;
  title: string;
  description?: string;
  location?: string;
  durationMin?: number;
  costEstimate?: string;
  latitude?: number;
  longitude?: number;
};

export type UpdateActivityInput = Partial<CreateActivityInput>;

export type SaveBookingInput = {
  kind: BookingKind;
  title: string;
  provider: string;
  priceText?: string;
  location?: string;
  startsAt?: string;
  endsAt?: string;
  detail?: string;
  externalUrl?: string;
};

export type UpdateBookingInput = Partial<SaveBookingInput>;

export type ShareState = {
  isShared: boolean;
  shareToken: string | null;
  sharePath: string | null;
};

export type CollaboratorRole = 'viewer' | 'editor';

export type Collaborator = {
  id: string;
  email: string;
  name: string | null;
  role: CollaboratorRole;
  invitedAt: string;
};

/** A trip in the signed-in user's "shared with me" list, not one they own. */
export type SharedWithMeTrip = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  ownerName: string;
  role: CollaboratorRole;
  sharedAt: string;
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

export type GuideItem = { title: string; blurb: string; imageUrl: string | null };

/** Blog-style guide on the destination screen. Editorial and indicative — no prices or hours. */
export type DestinationGuide = {
  intro: string;
  places: GuideItem[];
  restaurants: GuideItem[];
  culture: GuideItem[];
  food: GuideItem[];
  stay: GuideItem[];
  packing: string[];
  photoCredit: string;
};

export type DestinationDetail = Destination & { guide: DestinationGuide };

export type Suggestion = Destination & {
  reason: string;
  score: number;
};

export type TrendingDestination = Destination & {
  tripCount: number;
  inSeason: boolean;
};

export type UnreadSummary = {
  total: number;
  /** Unread count keyed by the sender's user id. */
  byPeer: Record<string, number>;
};
