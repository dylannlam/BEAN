import { Visit } from "../data/types";

/** Beli-style pairwise ranking: binary-searches the new visit's position
 * within the user's existing "been" visits (sorted best-to-worst by score),
 * then interpolates a final score that preserves strict ordering. */

export interface ComparisonRange {
  low: number;
  high: number;
}

export function initialRange(rankedVisits: Visit[]): ComparisonRange {
  return { low: 0, high: rankedVisits.length };
}

export function isRankingDone({ low, high }: ComparisonRange): boolean {
  return low >= high;
}

/** The visit to compare the new one against next, or null once done. */
export function nextComparisonVisit(rankedVisits: Visit[], range: ComparisonRange): Visit | null {
  if (isRankingDone(range)) return null;
  const mid = Math.floor((range.low + range.high) / 2);
  return rankedVisits[mid];
}

/** Narrows the search range given the user's answer for the current comparison. */
export function applyComparison(range: ComparisonRange, newCafeWasBetter: boolean): ComparisonRange {
  const mid = Math.floor((range.low + range.high) / 2);
  return newCafeWasBetter ? { ...range, high: mid } : { ...range, low: mid + 1 };
}

/** Final score once the insertion index (range.low === range.high) is found —
 * the midpoint between the neighbors it now sits between, so sort order by
 * score always matches the comparison outcomes. */
export function interpolateScore(
  rankedVisits: Visit[],
  insertionIndex: number,
  fallback: number
): number {
  const better = rankedVisits[insertionIndex - 1];
  const worse = rankedVisits[insertionIndex];

  if (better && worse) {
    return Math.round(((better.score + worse.score) / 2) * 100) / 100;
  }
  if (better) {
    return Math.round(Math.max(0, better.score - 0.3) * 100) / 100;
  }
  if (worse) {
    return Math.round(Math.min(10, worse.score + 0.3) * 100) / 100;
  }
  return fallback;
}
