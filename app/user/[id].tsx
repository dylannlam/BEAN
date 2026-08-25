import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { badgeRepository, userRepository, visitRepository } from "../../src/data/repositories";
import { useAsync } from "../../src/lib/useAsync";
import { useSessionStore } from "../../src/store/session";
import { UserAvatar } from "../../src/components/Avatar";
import { computeUserStats } from "../../src/lib/gamification";
import { FONT_SERIF_BOLD } from "../../src/lib/fonts";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useSessionStore((s) => s.currentUserId);
  const [pendingFollow, setPendingFollow] = useState(false);

  const { data, loading, reload } = useAsync(async () => {
    const [user, visits, badges, myFollowing, followers] = await Promise.all([
      userRepository.getUser(id),
      visitRepository.listVisits(),
      badgeRepository.listBadges(),
      userRepository.listFollowing(currentUserId),
      userRepository.listFollowers(id),
    ]);
    const following = await userRepository.listFollowing(id);
    return { user, visits, badges, myFollowing, followers, following };
  }, [id, currentUserId]);

  const stats = useMemo(() => {
    if (!data) return null;
    return computeUserStats(id, data.visits);
  }, [data, id]);

  if (id === currentUserId) {
    return <Redirect href="/(tabs)/profile" />;
  }

  if (loading || !data || !data.user || !stats) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const { user } = data;
  const isFollowing = data.myFollowing.some((f) => f.followingId === user.id);

  const handleToggleFollow = async () => {
    setPendingFollow(true);
    if (isFollowing) {
      await userRepository.unfollow(currentUserId, user.id);
    } else {
      await userRepository.follow(currentUserId, user.id);
    }
    await reload();
    setPendingFollow(false);
  };

  return (
    <ScrollView className="flex-1 bg-cream p-4">
      <View className="items-center mb-6 mt-2">
        <UserAvatar user={user} size={72} />
        <Text style={{ fontFamily: FONT_SERIF_BOLD }} className="text-xl text-espresso mt-2">
          {user.displayName}
        </Text>
        <Text className="text-espresso/60 mb-3">@{user.username}</Text>

        <Pressable
          onPress={handleToggleFollow}
          disabled={pendingFollow}
          className={`flex-row items-center rounded-full px-5 py-2.5 ${
            isFollowing ? "bg-white border border-espresso" : "bg-espresso"
          }`}
        >
          <Ionicons
            name={isFollowing ? "checkmark" : "add"}
            size={16}
            color={isFollowing ? "#3D2B1F" : "#FFF8F0"}
            style={{ marginRight: 5 }}
          />
          <Text className={isFollowing ? "text-espresso font-semibold" : "text-cream font-semibold"}>
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </Pressable>
      </View>

      <View className="flex-row bg-white rounded-2xl border border-latte/40 mb-3">
        <Stat label="Points" value={stats.points} />
        <Stat label="Cafes" value={stats.uniqueCafeCount} />
        <Stat label="Streak" value={`${stats.streakDays}d`} />
      </View>

      <View className="flex-row bg-white rounded-2xl border border-latte/40 mb-6">
        <Pressable
          className="flex-1"
          onPress={() => router.push({ pathname: "/user/friends", params: { userId: user.id, tab: "followers" } })}
        >
          <Stat label="Followers" value={data.followers.length} />
        </Pressable>
        <Pressable
          className="flex-1"
          onPress={() => router.push({ pathname: "/user/friends", params: { userId: user.id, tab: "following" } })}
        >
          <Stat label="Following" value={data.following.length} />
        </Pressable>
      </View>

      <Text className="text-lg font-semibold text-espresso mb-2">Badges</Text>
      <View className="flex-row flex-wrap mb-6">
        {data.badges.map((badge) => {
          const earned = stats.badgeIds.includes(badge.id);
          return (
            <View
              key={badge.id}
              className={`w-[31%] mr-[3.5%] mb-3 rounded-2xl p-3 items-center border ${
                earned ? "bg-white border-accent" : "bg-white/40 border-latte/40"
              }`}
            >
              <Ionicons
                name={badge.icon as keyof typeof Ionicons.glyphMap}
                size={26}
                color="#3D2B1F"
                style={{ opacity: earned ? 1 : 0.3 }}
              />
              <Text
                className={`text-xs text-center mt-1 ${
                  earned ? "text-espresso font-semibold" : "text-espresso/40"
                }`}
              >
                {badge.label}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="flex-1 items-center py-4">
      <Text style={{ fontFamily: FONT_SERIF_BOLD }} className="text-xl text-espresso">
        {value}
      </Text>
      <Text className="text-xs text-espresso/60">{label}</Text>
    </View>
  );
}
