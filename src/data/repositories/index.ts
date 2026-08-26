import { isSupabaseConfigured } from "../../lib/supabase";
import {
  MockBadgeRepository,
  MockCafeRepository,
  MockCommentRepository,
  MockUserRepository,
  MockVisitRepository,
} from "./mock";
import {
  SupabaseBadgeRepository,
  SupabaseCafeRepository,
  SupabaseCommentRepository,
  SupabaseUserRepository,
  SupabaseVisitRepository,
} from "./supabase";

// Falls back to the in-memory mock layer until EXPO_PUBLIC_SUPABASE_URL /
// EXPO_PUBLIC_SUPABASE_ANON_KEY are set, so the app keeps working without an
// account. Once both are configured, every screen is backed by the real
// database — no UI code depends on which one is active.
export const cafeRepository = isSupabaseConfigured
  ? new SupabaseCafeRepository()
  : new MockCafeRepository();
export const visitRepository = isSupabaseConfigured
  ? new SupabaseVisitRepository()
  : new MockVisitRepository();
export const userRepository = isSupabaseConfigured
  ? new SupabaseUserRepository()
  : new MockUserRepository();
export const badgeRepository = isSupabaseConfigured
  ? new SupabaseBadgeRepository()
  : new MockBadgeRepository();
export const commentRepository = isSupabaseConfigured
  ? new SupabaseCommentRepository()
  : new MockCommentRepository();

export * from "./types";
