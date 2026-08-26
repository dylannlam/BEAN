import { CATEGORY_KEYS, CategoryScores, RatingValue } from "../data/types";

export function scoreColor(score: number): string {
  if (score >= 8) return "#3F8F5C";
  if (score >= 5) return "#D8A428";
  return "#C0503E";
}

/** Sum of the 10 category scores — a 10.00-100.00 total. */
export function totalOutOf100(categories: CategoryScores): number {
  return Math.round(CATEGORY_KEYS.reduce((sum, key) => sum + categories[key], 0) * 100) / 100;
}

/** The app's canonical 0-10 score, derived from the category breakdown. */
export function scoreFromCategories(categories: CategoryScores): number {
  return Math.round((totalOutOf100(categories) / 10) * 100) / 100;
}

/** Good/Fine/Bad is a display bucket derived from the score, not picked
 * directly — thresholds match scoreColor's so the badge and the cup/leaderboard
 * colors always agree. */
export function deriveRating(score: number): RatingValue {
  if (score >= 8) return "good";
  if (score >= 5) return "fine";
  return "bad";
}
