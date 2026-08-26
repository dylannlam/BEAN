import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { cafeRepository, commentRepository, userRepository, visitRepository } from "../../src/data/repositories";
import { useAsync } from "../../src/lib/useAsync";
import { useSessionStore } from "../../src/store/session";
import { VisitCard } from "../../src/components/VisitCard";
import { Logo } from "../../src/components/Logo";
import { priceLabel } from "../../src/components/CafeCard";
import { Cafe, Comment, User, Visit } from "../../src/data/types";
import { HOME_BASE, formatMiles, milesBetween, nearestCafes } from "../../src/lib/distance";

export default function FeedScreen() {
  const currentUserId = useSessionStore((s) => s.currentUserId);
  const [userLocation, setUserLocation] = useState(HOME_BASE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      try {
        const position = await Location.getCurrentPositionAsync({});
        if (!cancelled) {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        }
      } catch {
        // Keep the HOME_BASE fallback already set.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { data, loading, reload } = useAsync(async () => {
    const [visits, cafes, users, following, comments] = await Promise.all([
      visitRepository.listVisits(),
      cafeRepository.listCafes(),
      userRepository.listUsers(),
      userRepository.listFollowing(currentUserId),
      commentRepository.listComments(),
    ]);
    return { visits, cafes, users, following, comments };
  }, [currentUserId]);

  const feedVisits = useMemo(() => {
    if (!data) return [];
    const followingIds = new Set(data.following.map((f) => f.followingId));
    followingIds.add(currentUserId);
    return data.visits.filter((v) => v.status === "been" && followingIds.has(v.userId));
  }, [data, currentUserId]);

  // A brand-new account has no logged visits yet — that's this app's signal
  // for "just created an account", without needing separate signup tracking.
  const isNewUser = useMemo(() => {
    if (!data) return false;
    return !data.visits.some((v) => v.userId === currentUserId);
  }, [data, currentUserId]);

  const nearbyRecommendations = useMemo(() => {
    if (!data || !isNewUser) return [];
    return nearestCafes(data.cafes, userLocation, 8);
  }, [data, isNewUser, userLocation]);

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
          nearbyRecommendations={nearbyRecommendations}
          userLocation={userLocation}
          onToggleLike={async (visitId) => {
            await visitRepository.toggleLike(visitId, currentUserId);
            reload();
          }}
        />
      )}
    </SafeAreaView>
  );
}

function NearbyRecommendations({
  cafes,
  userLocation,
}: {
  cafes: Cafe[];
  userLocation: { lat: number; lng: number };
}) {
  return (
    <View className="mb-5">
      <Text className="text-lg font-bold text-espresso mb-0.5">Welcome to Bean ☕</Text>
      <Text className="text-espresso/60 text-sm mb-3">Here are some cafes near you to start with</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={cafes}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingRight: 4 }}
        renderItem={({ item }) => (
          <Link href={{ pathname: "/cafe/[id]", params: { id: item.id } }} asChild>
            <Pressable className="bg-white rounded-2xl border border-latte/40 overflow-hidden mr-3" style={{ width: 160 }}>
              <Image source={{ uri: item.photoUrl }} className="w-full h-24" resizeMode="cover" />
              <View className="p-2.5">
                <Text className="text-[13px] font-semibold text-espresso" numberOfLines={1}>
                  {item.name}
                </Text>
                <View className="flex-row items-center justify-between mt-0.5">
                  <Text className="text-espresso/50 text-xs">{formatMiles(milesBetween(userLocation, item))}</Text>
                  <Text className="text-espresso/50 text-xs">{priceLabel(item.priceLevel)}</Text>
                </View>
              </View>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

function FeedList({
  data,
  feedVisits,
  currentUserId,
  nearbyRecommendations,
  userLocation,
  onToggleLike,
}: {
  data: {
    visits: Visit[];
    cafes: Cafe[];
    users: User[];
    comments: Comment[];
  };
  feedVisits: Visit[];
  currentUserId: string;
  nearbyRecommendations: Cafe[];
  userLocation: { lat: number; lng: number };
  onToggleLike: (visitId: string) => void;
}) {
  const cafeById = new Map(data.cafes.map((c) => [c.id, c]));
  const userById = new Map(data.users.map((u) => [u.id, u]));
  const commentCountByVisitId = new Map<string, number>();
  for (const comment of data.comments) {
    commentCountByVisitId.set(comment.visitId, (commentCountByVisitId.get(comment.visitId) ?? 0) + 1);
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, paddingTop: 4 }}
      data={feedVisits}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        nearbyRecommendations.length > 0 ? (
          <NearbyRecommendations cafes={nearbyRecommendations} userLocation={userLocation} />
        ) : null
      }
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
            commentCount={commentCountByVisitId.get(item.id) ?? 0}
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
