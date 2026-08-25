import { create } from "zustand";
import { CURRENT_USER_ID } from "../data/mock/users";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

interface SessionState {
  /** True while the real Supabase session is still being restored on launch. */
  initializing: boolean;
  isSignedIn: boolean;
  currentUserId: string;
  signOut: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  // In mock mode there's no real auth — behave as if a single demo user is
  // always signed in, same as before Supabase was wired up.
  initializing: isSupabaseConfigured,
  isSignedIn: !isSupabaseConfigured,
  currentUserId: CURRENT_USER_ID,
  signOut: async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
  },
}));

if (isSupabaseConfigured) {
  supabase.auth.onAuthStateChange((_event, session) => {
    useSessionStore.setState({
      initializing: false,
      isSignedIn: session !== null,
      currentUserId: session?.user.id ?? CURRENT_USER_ID,
    });
  });
}
