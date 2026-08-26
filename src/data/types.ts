export type TagCategory = "vibe" | "type" | "practical";

export interface Tag {
  id: string;
  label: string;
  category: TagCategory;
  /** Ionicons glyph name (outline variant). */
  icon: string;
  /** How this tag reads in "you have N options for ___" copy. */
  activityLabel?: string;
}

export type PriceLevel = 1 | 2 | 3;

export interface Cafe {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  priceLevel: PriceLevel;
  photoUrl: string;
  tagIds: string[];
  /** Closing hour today, 24h clock (e.g. 19 = 7pm). */
  closeHour: number;
  /** Short editorial blurb — what the place is like, what it's good for. */
  description?: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  joinedAt: string;
}

export type RatingValue = "good" | "fine" | "bad";

/** Beli-style category breakdown, each scored 1.00-10.00. Their sum is the
 * visit's 10.00-100.00 total (see `totalOutOf100` in lib/score.ts). */
export interface CategoryScores {
  coffeePrice: number;
  location: number;
  ambience: number;
  music: number;
  aesthetic: number;
  coffeeTaste: number;
  furniture: number;
  lighting: number;
  food: number;
  people: number;
}

export const CATEGORY_LABELS: Record<keyof CategoryScores, string> = {
  coffeePrice: "Coffee Price",
  location: "Location",
  ambience: "Ambience",
  music: "Music",
  aesthetic: "Aesthetic",
  coffeeTaste: "Coffee Taste",
  furniture: "Furniture",
  lighting: "Lighting",
  food: "Food",
  people: "People",
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as (keyof CategoryScores)[];

/** Neutral midpoint breakdown for a "want to try" visit that hasn't been rated yet. */
export const NEUTRAL_CATEGORY_SCORES: CategoryScores = CATEGORY_KEYS.reduce(
  (acc, key) => ({ ...acc, [key]: 5.5 }),
  {} as CategoryScores
);

export interface Visit {
  id: string;
  userId: string;
  cafeId: string;
  rating: RatingValue;
  /** Final 0-10 score. Starts from the category breakdown but gets nudged by
   * the comparison ranking flow, so it can drift slightly from
   * `categoryScores`' own average — that drift IS the ranking. */
  score: number;
  categoryScores: CategoryScores;
  note: string;
  tagIds: string[];
  status: "been" | "want";
  createdAt: string;
  likeUserIds: string[];
  photoUrls: string[];
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  /** Ionicons glyph name (outline variant). */
  icon: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
}

export interface Comment {
  id: string;
  visitId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export const RATING_LABEL: Record<RatingValue, string> = {
  good: "Good",
  fine: "Fine",
  bad: "Bad",
};
