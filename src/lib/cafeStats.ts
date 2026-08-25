import { User, Visit } from "../data/types";

/** This user's personal "been" ranking for one cafe (1 = their favorite), or null if unvisited. */
export function getUserRankForCafe(
  userId: string,
  cafeId: string,
  allVisits: Visit[]
): number | null {
  const ranked = allVisits
    .filter((v) => v.userId === userId && v.status === "been")
    .sort((a, b) => b.score - a.score);
  const index = ranked.findIndex((v) => v.cafeId === cafeId);
  return index === -1 ? null : index + 1;
}

export function getUserScoreForCafe(userId: string, cafeId: string, allVisits: Visit[]): number | null {
  const visit = allVisits.find((v) => v.userId === userId && v.cafeId === cafeId && v.status === "been");
  return visit ? visit.score : null;
}

/** Average score across every logged visit to this cafe, from any user. */
export function getCrowdScore(cafeId: string, allVisits: Visit[]): number | null {
  const visits = allVisits.filter((v) => v.cafeId === cafeId && v.status === "been");
  if (visits.length === 0) return null;
  return visits.reduce((sum, v) => sum + v.score, 0) / visits.length;
}

export interface TopReview {
  user: User;
  note: string;
  rank: number;
  score: number;
}

/** The highest-scoring visit to this cafe from someone other than excludeUserId, with their personal rank for it. */
export function getTopReview(
  cafeId: string,
  allVisits: Visit[],
  users: User[],
  excludeUserId: string
): TopReview | null {
  const candidates = allVisits
    .filter((v) => v.cafeId === cafeId && v.status === "been" && v.userId !== excludeUserId && v.note)
    .sort((a, b) => b.score - a.score);
  const top = candidates[0];
  if (!top) return null;

  const user = users.find((u) => u.id === top.userId);
  if (!user) return null;

  const rank = getUserRankForCafe(top.userId, cafeId, allVisits);
  if (rank === null) return null;

  return { user, note: top.note, rank, score: top.score };
}
