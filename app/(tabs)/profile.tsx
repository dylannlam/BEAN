import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { badgeRepository, userRepository, visitRepository } from "../../src/data/repositories";
import { useAsync } from "../../src/lib/useAsync";
import { useSessionStore } from "../../src/store/session";
import { UserAvatar } from "../../src/components/Avatar";
import { Logo } from "../../src/components/Logo";
import { computeUserStats } from "../../src/lib/gamification";
import { FONT_SERIF_BOLD } from "../../src/lib/fonts";

export default function ProfileScreen() {
  const currentUserId = useSessionStore((s) => s.currentUserId);
  const signOut = useSessionStore((s) => s.signOut);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data, loading, reload } = useAsync(async () => {
    const [user, visits, badges, following, followers] = await Promise.all([
      userRepository.getCurrentUser(),
      visitRepository.listVisits(),
      badgeRepository.listBadges(),
      userRepository.listFollowing(currentUserId),
      userRepository.listFollowers(currentUserId),
    ]);
    return { user, visits, badges, following, followers };
  }, [currentUserId]);

  const stats = useMemo(() => {
    if (!data) return null;
    return computeUserStats(currentUserId, data.visits);
  }, [data, currentUserId]);

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to set a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    setUploadingAvatar(true);
    try {
      await userRepository.uploadAvatar(currentUserId, result.assets[0].uri);
      reload();
    } catch {
      Alert.alert("Upload failed", "Couldn't update your profile picture. Try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading || !data || !stats) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
      <View className="px-4 pt-2 pb-1">
        <Logo size={22} textSize={17} />
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="items-center mb-6 mt-2">
          <Pressable onPress={handleChangeAvatar} disabled={uploadingAvatar} className="relative">
            <UserAvatar user={data.user} size={72} />
            <View
              className="absolute bottom-0 right-0 bg-espresso rounded-full items-center justify-center border-2 border-cream"
              style={{ width: 26, height: 26 }}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFF8F0" />
              ) : (
                <Ionicons name="camera" size={13} color="#FFF8F0" />
              )}
            </View>
          </Pressable>
          <Text style={{ fontFamily: FONT_SERIF_BOLD }} className="text-xl text-espresso mt-2">
            {data.user.displayName}
          </Text>
          <Text className="text-espresso/60">@{data.user.username}</Text>
        </View>

        <View className="flex-row bg-white rounded-2xl border border-latte/40 mb-3">
          <Stat label="Points" value={stats.points} />
          <Stat label="Cafes" value={stats.uniqueCafeCount} />
          <Stat label="Streak" value={`${stats.streakDays}d`} />
        </View>

        <View className="flex-row bg-white rounded-2xl border border-latte/40 mb-6">
          <Pressable
            className="flex-1"
            onPress={() =>
              router.push({ pathname: "/user/friends", params: { userId: currentUserId, tab: "followers" } })
            }
          >
            <Stat label="Followers" value={data.followers.length} />
          </Pressable>
          <Pressable
            className="flex-1"
            onPress={() =>
              router.push({ pathname: "/user/friends", params: { userId: currentUserId, tab: "following" } })
            }
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

        <Pressable
          onPress={async () => {
            await signOut();
            router.replace("/auth");
          }}
          className="border border-espresso rounded-xl py-3 items-center mb-8"
        >
          <Text className="text-espresso font-semibold">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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
