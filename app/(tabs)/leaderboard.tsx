import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { cafeRepository, userRepository, visitRepository } from "../../src/data/repositories";
import { useAsync } from "../../src/lib/useAsync";
import { useSessionStore } from "../../src/store/session";
import { UserAvatar } from "../../src/components/Avatar";
import { Logo } from "../../src/components/Logo";
import { FilterDropdown } from "../../src/components/FilterDropdown";
import { computeLeaderboard, LeaderboardWindow } from "../../src/lib/gamification";
import { FONT_SANS_MEDIUM, FONT_SERIF_BOLD, FONT_SERIF_SEMIBOLD } from "../../src/lib/fonts";
import { Visit } from "../../src/data/types";

const WINDOW_OPTIONS: { value: LeaderboardWindow; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

type MemberScope = "all" | "friends";

const MEMBER_OPTIONS: { value: MemberScope; label: string }[] = [
  { value: "all", label: "All members" },
  { value: "friends", label: "Friends" },
];

const ALL_AREAS = "all";

const MEDAL_COLORS = ["#D4AF37", "#A8A9AD", "#B5651D"];

function RankMark({ rank }: { rank: number }) {
  if (rank <= 3) {
    return <Ionicons name="trophy" size={22} color={MEDAL_COLORS[rank - 1]} />;
  }
  return (
    <Text style={{ fontFamily: FONT_SERIF_BOLD, fontSize: 20, color: "#3D2B1F66" }}>{rank}</Text>
  );
}

export default function LeaderboardScreen() {
  const currentUserId = useSessionStore((s) => s.currentUserId);
  const [window, setWindow] = useState<LeaderboardWindow>("all");
  const [memberScope, setMemberScope] = useState<MemberScope>("all");
  const [area, setArea] = useState<string>(ALL_AREAS);

  const { data, loading } = useAsync(async () => {
    const [users, visits, cafes, following] = await Promise.all([
      userRepository.listUsers(),
      visitRepository.listVisits(),
      cafeRepository.listCafes(),
      userRepository.listFollowing(currentUserId),
    ]);
    return { users, visits, cafes, following };
  }, [currentUserId]);

  const areaOptions = useMemo(() => {
    if (!data) return [{ value: ALL_AREAS, label: "All Areas" }];
    const neighborhoods = Array.from(new Set(data.cafes.map((c) => c.neighborhood))).sort();
    return [{ value: ALL_AREAS, label: "All Areas" }, ...neighborhoods.map((n) => ({ value: n, label: n }))];
  }, [data]);

  const leaderboard = useMemo(() => {
    if (!data) return [];

    const cafeById = new Map(data.cafes.map((c) => [c.id, c]));
    const visitsInArea: Visit[] =
      area === ALL_AREAS
        ? data.visits
        : data.visits.filter((v) => cafeById.get(v.cafeId)?.neighborhood === area);

    const memberIds =
      memberScope === "friends"
        ? [currentUserId, ...data.following.map((f) => f.followingId)]
        : data.users.map((u) => u.id);

    return computeLeaderboard(memberIds, visitsInArea, window);
  }, [data, window, memberScope, area, currentUserId]);

  if (loading || !data) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const userById = new Map(data.users.map((u) => [u.id, u]));
  const memberLabel = MEMBER_OPTIONS.find((o) => o.value === memberScope)!.label;
  const areaLabel = areaOptions.find((o) => o.value === area)?.label ?? "All Areas";
  const windowLabel = WINDOW_OPTIONS.find((o) => o.value === window)!.label;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
      <View className="px-4 pt-2 pb-2">
        <View className="mb-3">
          <Logo size={22} textSize={17} />
        </View>

        <Text style={{ fontFamily: FONT_SERIF_BOLD }} className="text-3xl text-espresso mb-3">
          Leaderboard
        </Text>

        <View className="flex-row">
          <FilterDropdown label={memberLabel} value={memberScope} options={MEMBER_OPTIONS} onChange={setMemberScope} />
          <FilterDropdown label={areaLabel} value={area} options={areaOptions} onChange={setArea} />
          <FilterDropdown label={windowLabel} value={window} options={WINDOW_OPTIONS} onChange={setWindow} />
        </View>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        data={leaderboard}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => {
          const user = userById.get(item.userId);
          if (!user) return null;
          const isMe = item.userId === currentUserId;
          const tastePercent = Math.round(item.avgScore * 10);
          return (
            <View className="flex-row items-center mb-4">
              <View style={{ width: 28, alignItems: "center" }}>
                <RankMark rank={item.rank} />
              </View>
              <Pressable
                onPress={() => router.push({ pathname: "/user/[id]", params: { id: user.id } })}
                className="flex-1 flex-row items-center"
              >
                <UserAvatar user={user} size={38} />
                <View className="flex-1 ml-3">
                  <Text style={{ fontFamily: FONT_SERIF_SEMIBOLD }} className="text-lg text-espresso">
                    {user.displayName}
                    {isMe ? " (You)" : ""}
                  </Text>
                  <Text
                    style={{ fontFamily: FONT_SANS_MEDIUM }}
                    className="text-xs text-espresso/45 mt-0.5"
                  >
                    {item.totalVisits > 0
                      ? `Been ${item.uniqueCafeCount} shop${item.uniqueCafeCount === 1 ? "" : "s"} · ${tastePercent}% taste`
                      : "No visits logged yet"}
                  </Text>
                </View>
              </Pressable>
              <Pressable className="border border-espresso rounded-full px-3 py-1.5">
                <Text className="text-espresso text-xs font-semibold">Steal List</Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-espresso/60">No one matches these filters yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
