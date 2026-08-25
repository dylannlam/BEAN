# Bean

A gamified, Beli-style cafe tracker for London: log the coffee/food spots you've tried, rate them, tag what they're good for (study, coffee chats, dates, work…), and compete with friends on a leaderboard.

## Stack

- Expo (React Native) + TypeScript, Expo Router for navigation
- NativeWind (Tailwind) for styling
- Zustand for client state
- react-native-maps for the in-app map (inside the Search tab)
- Google Places API (New) for live cafe search/autocomplete

Cafes, visits, users, badges, and follows come from an **in-memory mock layer** (`src/data/mock`) behind repository interfaces (`src/data/repositories`) — no Supabase account is required to run the app. Google Places search is real and requires an API key (see below); Supabase auth/database is designed for but not yet wired up.

## Running the app

```sh
npm install
npx expo start
```

Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

### Google Places API key

Cafe search in the Search tab queries the real Google Places API (New). To enable it:

1. Create a Google Cloud project, enable billing, and enable **Places API (New)**
2. Create an API key under **APIs & Services → Credentials**, and restrict it to Places API + your app's bundle ID / package name
3. Add it to a `.env` file at the project root (already gitignored):
   ```
   EXPO_PUBLIC_GOOGLE_PLACES_KEY=AIza...
   ```
4. Restart `expo start` so the key gets picked up

Without a key, Search still works fully against the mock cafe data — the "From Google Maps" results section just won't appear. Note that `EXPO_PUBLIC_*` vars are compiled directly into the client bundle (that's how Expo's env vars work), so the key's protection comes entirely from restricting it in Google Cloud Console, not from keeping it out of the bundle.

## Project structure

```
app/                  Expo Router screens (file-based routing)
  (tabs)/             Home (feed), Your List, Leaderboard, Search, Profile
  cafe/[id].tsx        Cafe detail
  log/[cafeId].tsx      Log-a-visit flow
  auth/index.tsx        Stubbed sign-in
src/
  data/types.ts        Shared domain types
  data/mock/           Fixture data (users, cafes, visits, tags, badges)
  data/repositories/   Data-access interfaces + mock implementation
  lib/tags.ts           Filter/tag taxonomy (vibe, type, practical)
  lib/gamification.ts   Points, streaks, badges, leaderboard scoring
  lib/places.ts          Google Places (New) client — autocomplete + place details
  lib/cafeStats.ts        Per-cafe rank/crowd-score helpers
  lib/distance.ts          Distance-from-home + open-now helpers
  store/                Zustand stores (session, filters)
  components/           Shared UI (cards, pills, avatars, ratings, map bubbles)
supabase/migrations/    Postgres schema mirroring src/data/types.ts
```

The Map is not a separate tab — it's a List/Map toggle inside Search, since it shares the same filters and result set.

## Gamification (MVP)

- +15 points for logging a cafe you haven't logged before, +4 for a repeat visit
- +2 points per day of your current logging streak
- Badges unlock on milestones (first log, 5/15 unique cafes, 3 study-tagged visits, 3 date-tagged visits, 3/7-day streaks) — see `src/data/mock/badges.ts`
- Leaderboard (`app/(tabs)/leaderboard.tsx`) ranks users by points, filterable by week / month / all-time

Rating is a simple 3-tap Good/Fine/Bad (mapped to a 1–10 score) rather than Beli's pairwise-comparison ranking — a deliberate scope cut for the MVP.

## Swapping in a real backend

Google Places search is already live (see above). What's left is Supabase for auth + persistence:

1. Create a [Supabase](https://supabase.com) project and run `supabase/migrations/0001_init.sql` against it (via the SQL editor or `supabase db push`).
2. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env`.
3. Implement `Supabase*Repository` classes fulfilling the interfaces in `src/data/repositories/types.ts` (including persisting cafes added via Google Places into the `cafes` table), and swap the exports in `src/data/repositories/index.ts`.
4. Replace the stubbed `useSessionStore` sign-in with Supabase Auth (email or OAuth), and gate `app/_layout.tsx` on the session.

No UI code needs to change for this swap — screens only depend on the repository interfaces and Zustand stores.
