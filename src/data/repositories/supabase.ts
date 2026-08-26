import { supabase } from "../../lib/supabase";
import { Cafe, CategoryScores, Comment, Follow, PriceLevel, RatingValue, User, Visit } from "../types";
import { MOCK_BADGES } from "../mock/badges";
import {
  BadgeRepository,
  CafeRepository,
  CommentRepository,
  UserRepository,
  VisitRepository,
} from "./types";

interface CafeRow {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  price_level: number;
  photo_url: string | null;
  description: string | null;
  close_hour: number;
  google_place_id: string | null;
}

function rowToCafe(row: CafeRow, tagIds: string[]): Cafe {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    neighborhood: row.neighborhood,
    lat: row.lat,
    lng: row.lng,
    priceLevel: row.price_level as PriceLevel,
    photoUrl: row.photo_url ?? "",
    tagIds,
    closeHour: row.close_hour,
    description: row.description ?? undefined,
  };
}

interface VisitRow {
  id: string;
  user_id: string;
  cafe_id: string;
  rating: RatingValue;
  score: number;
  category_scores: CategoryScores;
  note: string | null;
  photo_urls: string[] | null;
  status: "been" | "want";
  created_at: string;
}

function rowToVisit(row: VisitRow, tagIds: string[], likeUserIds: string[]): Visit {
  return {
    id: row.id,
    userId: row.user_id,
    cafeId: row.cafe_id,
    rating: row.rating,
    score: row.score,
    categoryScores: row.category_scores,
    note: row.note ?? "",
    tagIds,
    status: row.status,
    createdAt: row.created_at,
    likeUserIds,
    photoUrls: row.photo_urls ?? [],
  };
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  joined_at: string;
}

function rowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? "",
    joinedAt: row.joined_at,
  };
}

function groupBy<T, K extends string>(rows: T[], key: (row: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const row of rows) {
    const k = key(row);
    (out[k] ??= []).push(row);
  }
  return out;
}

export class SupabaseCafeRepository implements CafeRepository {
  async listCafes(): Promise<Cafe[]> {
    const [{ data: cafeRows, error }, { data: tagRows }] = await Promise.all([
      supabase.from("cafes").select("*"),
      supabase.from("cafe_tags").select("cafe_id, tag_id"),
    ]);
    if (error) throw error;

    const tagsByCafe = groupBy(tagRows ?? [], (r) => r.cafe_id as string);
    return (cafeRows ?? []).map((row) =>
      rowToCafe(row, (tagsByCafe[row.id] ?? []).map((t) => t.tag_id))
    );
  }

  async getCafe(id: string): Promise<Cafe | undefined> {
    const { data: row } = await supabase.from("cafes").select("*").eq("id", id).maybeSingle();
    if (!row) return undefined;
    const { data: tagRows } = await supabase.from("cafe_tags").select("tag_id").eq("cafe_id", id);
    return rowToCafe(row, (tagRows ?? []).map((t) => t.tag_id));
  }

  async addCafe(cafe: Cafe): Promise<Cafe> {
    const googlePlaceId = cafe.id.startsWith("place-") ? cafe.id.slice("place-".length) : null;

    if (googlePlaceId) {
      const { data: existing } = await supabase
        .from("cafes")
        .select("*")
        .eq("google_place_id", googlePlaceId)
        .maybeSingle();
      if (existing) {
        const { data: tagRows } = await supabase
          .from("cafe_tags")
          .select("tag_id")
          .eq("cafe_id", existing.id);
        return rowToCafe(existing, (tagRows ?? []).map((t) => t.tag_id));
      }
    }

    const { data: row, error } = await supabase
      .from("cafes")
      .insert({
        name: cafe.name,
        address: cafe.address,
        neighborhood: cafe.neighborhood,
        lat: cafe.lat,
        lng: cafe.lng,
        price_level: cafe.priceLevel,
        photo_url: cafe.photoUrl,
        description: cafe.description ?? null,
        close_hour: cafe.closeHour,
        google_place_id: googlePlaceId,
      })
      .select()
      .single();
    if (error) throw error;

    if (cafe.tagIds.length > 0) {
      await supabase
        .from("cafe_tags")
        .insert(cafe.tagIds.map((tagId) => ({ cafe_id: row.id, tag_id: tagId })));
    }

    return rowToCafe(row, cafe.tagIds);
  }
}

export class SupabaseVisitRepository implements VisitRepository {
  private async hydrate(rows: VisitRow[]): Promise<Visit[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const [{ data: tagRows }, { data: likeRows }] = await Promise.all([
      supabase.from("visit_tags").select("visit_id, tag_id").in("visit_id", ids),
      supabase.from("visit_likes").select("visit_id, user_id").in("visit_id", ids),
    ]);
    const tagsByVisit = groupBy(tagRows ?? [], (r) => r.visit_id as string);
    const likesByVisit = groupBy(likeRows ?? [], (r) => r.visit_id as string);

    return rows.map((row) =>
      rowToVisit(
        row,
        (tagsByVisit[row.id] ?? []).map((t) => t.tag_id),
        (likesByVisit[row.id] ?? []).map((l) => l.user_id)
      )
    );
  }

  async listVisits(): Promise<Visit[]> {
    const { data, error } = await supabase
      .from("visits")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return this.hydrate(data ?? []);
  }

  async listVisitsByUser(userId: string): Promise<Visit[]> {
    const { data, error } = await supabase
      .from("visits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return this.hydrate(data ?? []);
  }

  async listVisitsByCafe(cafeId: string): Promise<Visit[]> {
    const { data, error } = await supabase
      .from("visits")
      .select("*")
      .eq("cafe_id", cafeId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return this.hydrate(data ?? []);
  }

  async addVisit(input: Omit<Visit, "id" | "createdAt" | "likeUserIds">): Promise<Visit> {
    const { data: row, error } = await supabase
      .from("visits")
      .insert({
        user_id: input.userId,
        cafe_id: input.cafeId,
        rating: input.rating,
        score: input.score,
        category_scores: input.categoryScores,
        note: input.note,
        photo_urls: input.photoUrls,
        status: input.status,
      })
      .select()
      .single();
    if (error) throw error;

    if (input.tagIds.length > 0) {
      await supabase
        .from("visit_tags")
        .insert(input.tagIds.map((tagId) => ({ visit_id: row.id, tag_id: tagId })));
    }

    return rowToVisit(row, input.tagIds, []);
  }

  async toggleLike(visitId: string, userId: string): Promise<Visit> {
    const { data: existing } = await supabase
      .from("visit_likes")
      .select()
      .eq("visit_id", visitId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase.from("visit_likes").delete().eq("visit_id", visitId).eq("user_id", userId);
    } else {
      await supabase.from("visit_likes").insert({ visit_id: visitId, user_id: userId });
    }

    const { data: row, error } = await supabase
      .from("visits")
      .select("*")
      .eq("id", visitId)
      .single();
    if (error) throw error;
    const [visit] = await this.hydrate([row]);
    return visit;
  }

  async uploadVisitPhoto(userId: string, fileUri: string): Promise<string> {
    const response = await fetch(fileUri);
    const arrayBuffer = await response.arrayBuffer();
    const extension = fileUri.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;
    const contentType = extension === "png" ? "image/png" : "image/jpeg";

    const { error: uploadError } = await supabase.storage
      .from("visit-photos")
      .upload(path, arrayBuffer, { contentType, upsert: true });
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("visit-photos").getPublicUrl(path);
    return publicUrl;
  }
}

export class SupabaseUserRepository implements UserRepository {
  async listUsers(): Promise<User[]> {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) throw error;
    return (data ?? []).map(rowToUser);
  }

  async getUser(id: string): Promise<User | undefined> {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    return data ? rowToUser(data) : undefined;
  }

  async getCurrentUser(): Promise<User> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (error) throw error;
    return rowToUser(data);
  }

  async listFollowing(userId: string): Promise<Follow[]> {
    const { data, error } = await supabase
      .from("follows")
      .select("follower_id, following_id")
      .eq("follower_id", userId);
    if (error) throw error;
    return (data ?? []).map((r) => ({ followerId: r.follower_id, followingId: r.following_id }));
  }

  async listFollowers(userId: string): Promise<Follow[]> {
    const { data, error } = await supabase
      .from("follows")
      .select("follower_id, following_id")
      .eq("following_id", userId);
    if (error) throw error;
    return (data ?? []).map((r) => ({ followerId: r.follower_id, followingId: r.following_id }));
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) return;
    const { error } = await supabase
      .from("follows")
      .upsert({ follower_id: followerId, following_id: followingId }, { onConflict: "follower_id,following_id" });
    if (error) throw error;
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    if (error) throw error;
  }

  async uploadAvatar(userId: string, fileUri: string): Promise<User> {
    const response = await fetch(fileUri);
    const arrayBuffer = await response.arrayBuffer();
    const extension = fileUri.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/${Date.now()}.${extension}`;
    const contentType = extension === "png" ? "image/png" : "image/jpeg";

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, arrayBuffer, { contentType, upsert: true });
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    const { data: row, error } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;

    return rowToUser(row);
  }
}

// Badges are a fixed, client-defined taxonomy (unlock criteria live in
// src/lib/gamification.ts) rather than user-generated data, so there's no
// badges table to query — this just mirrors the mock repository.
export class SupabaseBadgeRepository implements BadgeRepository {
  async listBadges() {
    return MOCK_BADGES;
  }
}

interface CommentRow {
  id: string;
  visit_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

function rowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    visitId: row.visit_id,
    userId: row.user_id,
    text: row.text,
    createdAt: row.created_at,
  };
}

export class SupabaseCommentRepository implements CommentRepository {
  async listComments(): Promise<Comment[]> {
    const { data, error } = await supabase
      .from("visit_comments")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToComment);
  }

  async listCommentsForVisit(visitId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from("visit_comments")
      .select("*")
      .eq("visit_id", visitId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToComment);
  }

  async addComment(input: Omit<Comment, "id" | "createdAt">): Promise<Comment> {
    const { data: row, error } = await supabase
      .from("visit_comments")
      .insert({ visit_id: input.visitId, user_id: input.userId, text: input.text })
      .select()
      .single();
    if (error) throw error;
    return rowToComment(row);
  }
}
