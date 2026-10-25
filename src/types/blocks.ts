/**
 * Mirror of `backend/src/agent/blocks.schema.ts`.
 *
 * Adding a block type is a THREE-file change: the backend tool schema, this union, and a
 * renderer in `src/components/blocks/`. See memory/01-product.md.
 */

export type TextBlock = { type: 'text'; body: string };

export type ItineraryCardBlock = {
  type: 'itinerary_card';
  dayNumber: number;
  title: string;
  summary: string;
  items: { timeOfDay: string; title: string; location: string }[];
};

export type PlaceListBlock = {
  type: 'place_list';
  heading: string;
  places: {
    name: string;
    location: string;
    reason: string;
    latitude: number | null;
    longitude: number | null;
  }[];
};

export type PackingSuggestionBlock = {
  type: 'packing_suggestion';
  heading: string;
  items: { label: string; category: string; quantity: number }[];
};

export type BookingOptionsBlock = {
  type: 'booking_options';
  kind: string;
  heading: string;
  options: { title: string; provider: string; priceText: string | null; detail: string }[];
};

export type WeatherBlock = {
  type: 'weather';
  location: string;
  /** Seasonal expectation, never a forecast. The renderer must label it. */
  summary: string;
  averageHighC: number | null;
  averageLowC: number | null;
};

export type MapPreviewBlock = {
  type: 'map_preview';
  heading: string;
  pins: { label: string; latitude: number; longitude: number }[];
};

export type ChoicePromptBlock = {
  type: 'choice_prompt';
  question: string;
  choices: { label: string; value: string }[];
};

/** A whole new trip proposed in chat. "Save trip" creates it (and its days, if present). */
export type TripSummaryBlock = {
  type: 'trip_summary';
  title: string;
  source: string;
  destination: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
  travelers: number;
  summary: string;
  /** Rough, model-produced. Never shown as a quote. */
  budgetText: string | null;
  highlights: string[];
  days: {
    dayNumber: number;
    title: string;
    summary: string;
    items: { timeOfDay: string; title: string; location: string }[];
  }[];
};

/** Tappable follow-ups under a reply. Each chip is sent back as the user's next message. */
export type SuggestionsBlock = { type: 'suggestions'; chips: string[] };

export type UiBlock =
  | TextBlock
  | ItineraryCardBlock
  | PlaceListBlock
  | PackingSuggestionBlock
  | BookingOptionsBlock
  | WeatherBlock
  | MapPreviewBlock
  | ChoicePromptBlock
  | TripSummaryBlock
  | SuggestionsBlock;

/** The blocks that carry a "Save to trip" action — mirrors SAVEABLE_BLOCK_TYPES server-side. */
export type SaveableBlock =
  | TripSummaryBlock
  | ItineraryCardBlock
  | PackingSuggestionBlock
  | BookingOptionsBlock;

/** `POST /agent/save` response. `message` is the confirmation shown on the button. */
export type SaveResult = {
  kind: SaveableBlock['type'];
  tripId: string;
  message: string;
};

/** Events on the `POST /agent/stream` SSE response. */
export type AgentStreamEvent =
  | { event: 'meta'; data: { conversationId: string } }
  | { event: 'text_delta'; data: { delta: string } }
  | { event: 'block'; data: { block: UiBlock } }
  | { event: 'done'; data: AgentReply }
  | { event: 'error'; data: { message: string } };

export type AgentMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  blocks: UiBlock[];
  createdAt: string;
};

export type AgentReply = {
  conversationId: string;
  message: AgentMessage;
};

export type AgentConversation = {
  id: string;
  title: string;
  tripId: string | null;
  updatedAt: string;
};
