import { Cafe, Follow, User, Visit } from "../types";
import { MOCK_BADGES } from "../mock/badges";
import { MOCK_CAFES } from "../mock/cafes";
import { MOCK_FOLLOWS } from "../mock/follows";
import { MOCK_USERS, CURRENT_USER_ID } from "../mock/users";
import { MOCK_VISITS } from "../mock/visits";
import {
  BadgeRepository,
  CafeRepository,
  UserRepository,
  VisitRepository,
} from "./types";

// In-memory store, seeded from fixtures. Simulates a database for this
// mock-data build; swap these classes for Supabase-backed implementations
// once a real project exists (see supabase/migrations/0001_init.sql).
let visits: Visit[] = [...MOCK_VISITS];
let nextVisitId = visits.length + 1;
let cafes: Cafe[] = [...MOCK_CAFES];
let follows: Follow[] = [...MOCK_FOLLOWS];
let users: User[] = [...MOCK_USERS];

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 120));
}

export class MockCafeRepository implements CafeRepository {
  async listCafes(): Promise<Cafe[]> {
    return delay(cafes);
  }

  async getCafe(id: string): Promise<Cafe | undefined> {
    return delay(cafes.find((c) => c.id === id));
  }

  async addCafe(cafe: Cafe): Promise<Cafe> {
    const existing = cafes.find((c) => c.id === cafe.id);
    if (existing) return delay(existing);
    cafes = [...cafes, cafe];
    return delay(cafe);
  }
}

export class MockVisitRepository implements VisitRepository {
  async listVisits(): Promise<Visit[]> {
    return delay([...visits].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  async listVisitsByUser(userId: string): Promise<Visit[]> {
    const list = visits
      .filter((v) => v.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return delay(list);
  }

  async listVisitsByCafe(cafeId: string): Promise<Visit[]> {
    const list = visits
      .filter((v) => v.cafeId === cafeId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return delay(list);
  }

  async addVisit(
    input: Omit<Visit, "id" | "createdAt" | "likeUserIds">
  ): Promise<Visit> {
    const visit: Visit = {
      ...input,
      id: `visit-${nextVisitId++}`,
      createdAt: new Date().toISOString(),
      likeUserIds: [],
    };
    visits = [visit, ...visits];
    return delay(visit);
  }

  async toggleLike(visitId: string, userId: string): Promise<Visit> {
    visits = visits.map((v) => {
      if (v.id !== visitId) return v;
      const hasLiked = v.likeUserIds.includes(userId);
      return {
        ...v,
        likeUserIds: hasLiked
          ? v.likeUserIds.filter((id) => id !== userId)
          : [...v.likeUserIds, userId],
      };
    });
    const updated = visits.find((v) => v.id === visitId);
    if (!updated) throw new Error(`Visit ${visitId} not found`);
    return delay(updated);
  }
}

export class MockUserRepository implements UserRepository {
  async listUsers() {
    return delay(users);
  }

  async getUser(id: string) {
    return delay(users.find((u) => u.id === id));
  }

  async getCurrentUser() {
    const user = users.find((u) => u.id === CURRENT_USER_ID);
    if (!user) throw new Error("Current user not found in mock data");
    return delay(user);
  }

  async listFollowing(userId: string) {
    return delay(follows.filter((f) => f.followerId === userId));
  }

  async listFollowers(userId: string) {
    return delay(follows.filter((f) => f.followingId === userId));
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) return;
    const exists = follows.some(
      (f) => f.followerId === followerId && f.followingId === followingId
    );
    if (!exists) follows = [...follows, { followerId, followingId }];
    await delay(undefined);
  }

  async unfollow(followerId: string, followingId: string) {
    follows = follows.filter(
      (f) => !(f.followerId === followerId && f.followingId === followingId)
    );
    await delay(undefined);
  }

  async uploadAvatar(userId: string, fileUri: string) {
    users = users.map((u) => (u.id === userId ? { ...u, avatarUrl: fileUri } : u));
    const updated = users.find((u) => u.id === userId);
    if (!updated) throw new Error(`User ${userId} not found`);
    return delay(updated);
  }
}

export class MockBadgeRepository implements BadgeRepository {
  async listBadges() {
    return delay(MOCK_BADGES);
  }
}
