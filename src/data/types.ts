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

export interface Visit {
  id: string;
  userId: string;
  cafeId: string;
  rating: RatingValue;
  score: number;
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

export const RATING_SCORE: Record<RatingValue, number> = {
  good: 9,
  fine: 6,
  bad: 3,
};

export const RATING_LABEL: Record<RatingValue, string> = {
  good: "Good",
  fine: "Fine",
  bad: "Bad",
};
