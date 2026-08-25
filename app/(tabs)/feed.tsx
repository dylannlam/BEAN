import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { cafeRepository, userRepository, visitRepository } from "../../src/data/repositories";
import { useAsync } from "../../src/lib/useAsync";
import { useSessionStore } from "../../src/store/session";
import { VisitCard } from "../../src/components/VisitCard";
import { Logo } from "../../src/components/Logo";
import { Cafe, User, Visit } from "../../src/data/types";

export default function FeedScreen() {
  const currentUserId = useSessionStore((s) => s.currentUserId);

  const { data, loading, reload } = useAsync(async () => {
    const [visits, cafes, users, following] = await Promise.all([
      visitRepository.listVisits(),
      cafeRepository.listCafes(),
      userRepository.listUsers(),
      userRepository.listFollowing(currentUserId),
    ]);
    return { visits, cafes, users, following };
  }, [currentUserId]);

  const feedVisits = useMemo(() => {
    if (!data) return [];
    const followingIds = new Set(data.following.map((f) => f.followingId));
    followingIds.add(currentUserId);
    return data.visits.filter((v) => v.status === "been" && followingIds.has(v.userId));
  }, [data, currentUserId]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
      <View className="px-4 pt-2 pb-3">
        <View className="mb-3">
          <Logo />
        </View>

        <Pressable
          onPress={() => router.push("/(tabs)/search")}
          className="flex-row items-center bg-espresso rounded-full px-4 py-3"
        >
          <Text className="flex-1 text-cream/70 text-[15px]">Your next café in London</Text>
          <Ionicons name="search-outline" size={18} color="#FFF8F0" />
        </Pressable>
      </View>

      {loading || !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FeedList
          data={data}
          feedVisits={feedVisits}
          currentUserId={currentUserId}
          onToggleLike={async (visitId) => {
            await visitRepository.toggleLike(visitId, currentUserId);
            reload();
          }}
        />
      )}
    </SafeAreaView>
  );
}

function FeedList({
  data,
  feedVisits,
  currentUserId,
  onToggleLike,
}: {
  data: {
    visits: Visit[];
    cafes: Cafe[];
    users: User[];
  };
  feedVisits: Visit[];
  currentUserId: string;
  onToggleLike: (visitId: string) => void;
}) {
  const cafeById = new Map(data.cafes.map((c) => [c.id, c]));
  const userById = new Map(data.users.map((u) => [u.id, u]));

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, paddingTop: 4 }}
      data={feedVisits}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const cafe = cafeById.get(item.cafeId);
        const user = userById.get(item.userId);
        if (!cafe || !user) return null;
        const reactedUsers = item.likeUserIds
          .map((id) => userById.get(id))
          .filter((u): u is NonNullable<typeof u> => Boolean(u));
        return (
          <VisitCard
            visit={item}
            cafe={cafe}
            user={user}
            currentUserId={currentUserId}
            reactedUsers={reactedUsers}
            onToggleLike={onToggleLike}
          />
        );
      }}
      ListEmptyComponent={
        <View className="items-center py-16">
          <Text className="text-espresso/60">
            No activity yet — follow friends or log your first cafe.
          </Text>
        </View>
      }
    />
  );
}
