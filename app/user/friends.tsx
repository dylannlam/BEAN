import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { userRepository } from "../../src/data/repositories";
import { User } from "../../src/data/types";
import { useAsync } from "../../src/lib/useAsync";
import { useSessionStore } from "../../src/store/session";
import { PersonRow } from "../../src/components/PersonRow";

type FriendsTab = "following" | "followers";

export default function FriendsScreen() {
  const { userId, tab } = useLocalSearchParams<{ userId: string; tab?: string }>();
  const currentUserId = useSessionStore((s) => s.currentUserId);
  const [activeTab, setActiveTab] = useState<FriendsTab>(tab === "followers" ? "followers" : "following");
  const [pendingFollowId, setPendingFollowId] = useState<string | null>(null);

  const { data, loading, reload } = useAsync(async () => {
    const [users, myFollowing, userFollowing, userFollowers] = await Promise.all([
      userRepository.listUsers(),
      userRepository.listFollowing(currentUserId),
      userRepository.listFollowing(userId),
      userRepository.listFollowers(userId),
    ]);
    return { users, myFollowing, userFollowing, userFollowers };
  }, [userId, currentUserId]);

  const usersById = useMemo(() => new Map(data?.users.map((u) => [u.id, u])), [data]);
  const followingIds = useMemo(
    () => new Set((data?.myFollowing ?? []).map((f) => f.followingId)),
    [data]
  );

  const list = useMemo((): User[] => {
    if (!data) return [];
    const ids =
      activeTab === "following"
        ? data.userFollowing.map((f) => f.followingId)
        : data.userFollowers.map((f) => f.followerId);
    return ids.map((id) => usersById.get(id)).filter((u): u is User => Boolean(u));
  }, [data, activeTab, usersById]);

  const handleToggleFollow = async (targetUserId: string, isFollowing: boolean) => {
    setPendingFollowId(targetUserId);
    if (isFollowing) {
      await userRepository.unfollow(currentUserId, targetUserId);
    } else {
      await userRepository.follow(currentUserId, targetUserId);
    }
    await reload();
    setPendingFollowId(null);
  };

  if (loading || !data) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-cream">
      <View className="px-4 pt-4 pb-2 items-center">
        <View className="flex-row bg-white rounded-full border border-latte p-0.5">
          {(["following", "followers"] as FriendsTab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-full ${activeTab === t ? "bg-espresso" : ""}`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeTab === t ? "text-cream" : "text-espresso/60"
                }`}
              >
                {t === "following" ? `Following (${data.userFollowing.length})` : `Followers (${data.userFollowers.length})`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={list}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        renderItem={({ item }) => (
          <PersonRow
            user={item}
            isFollowing={followingIds.has(item.id)}
            pending={pendingFollowId === item.id}
            onToggleFollow={() => handleToggleFollow(item.id, followingIds.has(item.id))}
          />
        )}
        ListEmptyComponent={
          <Text className="text-center text-espresso/50 mt-8">
            {activeTab === "following" ? "Not following anyone yet." : "No followers yet."}
          </Text>
        }
      />
    </SafeAreaView>
  );
}
