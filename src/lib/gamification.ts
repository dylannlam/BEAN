import { Visit } from "../data/types";

const POINTS_NEW_CAFE = 15;
const POINTS_REPEAT_VISIT = 4;
const POINTS_PER_STREAK_DAY = 2;

export type LeaderboardWindow = "week" | "month" | "all";

export interface UserStats {
  userId: string;
  points: number;
  uniqueCafeCount: number;
  totalVisits: number;
  streakDays: number;
  badgeIds: string[];
  /** Average visit score out of 10 (0 if no rated visits yet). */
  avgScore: number;
}

function toDayKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

function withinWindow(iso: string, window: LeaderboardWindow, now: Date): boolean {
  if (window === "all") return true;
  const created = new Date(iso).getTime();
  const days = window === "week" ? 7 : 30;
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return created >= cutoff;
}

/** Longest run of consecutive calendar days (ending today or yesterday) with a logged visit. */
export function computeStreakDays(beenVisits: Visit[], now: Date = new Date()): number {
  const dayKeys = new Set(beenVisits.map((v) => toDayKey(v.createdAt)));
  let streak = 0;
  const cursor = new Date(now);
  // allow the streak to still "count" if today has no log yet but yesterday does
  if (!dayKeys.has(toDayKey(cursor.toISOString()))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dayKeys.has(toDayKey(cursor.toISOString()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeUserStats(
  userId: string,
  allVisits: Visit[],
  options: { window?: LeaderboardWindow; now?: Date } = {}
): UserStats {
  const window = options.window ?? "all";
  const now = options.now ?? new Date();

  const userVisits = allVisits.filter(
    (v) => v.userId === userId && v.status === "been" && withinWindow(v.createdAt, window, now)
  );

  const seenCafes = new Set<string>();
  let points = 0;
  for (const visit of [...userVisits].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (!seenCafes.has(visit.cafeId)) {
      seenCafes.add(visit.cafeId);
      points += POINTS_NEW_CAFE;
    } else {
      points += POINTS_REPEAT_VISIT;
    }
  }

  const streakDays = computeStreakDays(userVisits, now);
  points += streakDays * POINTS_PER_STREAK_DAY;

  const badgeIds = computeBadgeIds(userVisits, seenCafes.size, streakDays);

  const avgScore =
    userVisits.length > 0
      ? userVisits.reduce((sum, v) => sum + v.score, 0) / userVisits.length
      : 0;

  return {
    userId,
    points,
    uniqueCafeCount: seenCafes.size,
    totalVisits: userVisits.length,
    streakDays,
    badgeIds,
    avgScore,
  };
}

function computeBadgeIds(userVisits: Visit[], uniqueCafeCount: number, streakDays: number): string[] {
  const badgeIds: string[] = [];

  if (userVisits.length >= 1) badgeIds.push("first-log");
  if (uniqueCafeCount >= 5) badgeIds.push("explorer-5");
  if (uniqueCafeCount >= 15) badgeIds.push("explorer-15");

  const studyCount = userVisits.filter((v) => v.tagIds.includes("study")).length;
  if (studyCount >= 3) badgeIds.push("study-spotter");

  const dateCount = userVisits.filter((v) => v.tagIds.includes("date")).length;
  if (dateCount >= 3) badgeIds.push("date-scout");

  if (streakDays >= 3) badgeIds.push("streak-3");
  if (streakDays >= 7) badgeIds.push("streak-7");

  return badgeIds;
}

export interface LeaderboardEntry extends UserStats {
  rank: number;
}

export function computeLeaderboard(
  userIds: string[],
  allVisits: Visit[],
  window: LeaderboardWindow = "all",
  now: Date = new Date()
): LeaderboardEntry[] {
  const stats = userIds.map((id) => computeUserStats(id, allVisits, { window, now }));
  stats.sort((a, b) => b.points - a.points);
  return stats.map((s, i) => ({ ...s, rank: i + 1 }));
}
