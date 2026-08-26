import { Badge, Cafe, Comment, Follow, User, Visit } from "../types";

export interface CafeRepository {
  listCafes(): Promise<Cafe[]>;
  getCafe(id: string): Promise<Cafe | undefined>;
  /** Adds a cafe (e.g. one found via Google Places) if it isn't already known. */
  addCafe(cafe: Cafe): Promise<Cafe>;
}

export interface VisitRepository {
  listVisits(): Promise<Visit[]>;
  listVisitsByUser(userId: string): Promise<Visit[]>;
  listVisitsByCafe(cafeId: string): Promise<Visit[]>;
  addVisit(visit: Omit<Visit, "id" | "createdAt" | "likeUserIds">): Promise<Visit>;
  toggleLike(visitId: string, userId: string): Promise<Visit>;
  /** Uploads the image at `fileUri` (a local file:// or content:// URI from
   * the image picker) for a visit-in-progress and returns its public URL. */
  uploadVisitPhoto(userId: string, fileUri: string): Promise<string>;
}

export interface UserRepository {
  listUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getCurrentUser(): Promise<User>;
  listFollowing(userId: string): Promise<Follow[]>;
  listFollowers(userId: string): Promise<Follow[]>;
  follow(followerId: string, followingId: string): Promise<void>;
  unfollow(followerId: string, followingId: string): Promise<void>;
  /** Uploads the image at `fileUri` (a local file:// or content:// URI from
   * the image picker) as the user's new avatar and returns the updated user. */
  uploadAvatar(userId: string, fileUri: string): Promise<User>;
}

export interface BadgeRepository {
  listBadges(): Promise<Badge[]>;
}

export interface CommentRepository {
  listComments(): Promise<Comment[]>;
  listCommentsForVisit(visitId: string): Promise<Comment[]>;
  addComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment>;
}
