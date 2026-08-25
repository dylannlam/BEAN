import { useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { cafeRepository, userRepository, visitRepository } from "../../src/data/repositories";
import { useAsync } from "../../src/lib/useAsync";
import { useSessionStore } from "../../src/store/session";
import { RatingBadge } from "../../src/components/RatingBadge";
import { TagPill } from "../../src/components/TagPill";
import { priceLabel } from "../../src/components/CafeCard";
import { UserAvatar } from "../../src/components/Avatar";
import { getTagById } from "../../src/lib/tags";
import { formatMiles, isOpenNow, milesFromHome, formatCloseHour } from "../../src/lib/distance";
import { FONT_SERIF_BOLD } from "../../src/lib/fonts";
import {
  getCrowdScore,
  getTopReview,
  getUserRankForCafe,
  getUserScoreForCafe,
} from "../../src/lib/cafeStats";

export default function CafeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useSessionStore((s) => s.currentUserId);
  const [wantAdded, setWantAdded] = useState(false);

  const { data, loading } = useAsync(async () => {
    const [cafe, visits, users] = await Promise.all([
      cafeRepository.getCafe(id),
      visitRepository.listVisitsByCafe(id),
      userRepository.listUsers(),
    ]);
    return { cafe, visits, users };
  }, [id]);

  if (loading || !data || !data.cafe) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator />
      </View>
    );
  }

  const { cafe, visits, users } = data;
  const userById = new Map(users.map((u) => [u.id, u]));
  const beenVisits = visits.filter((v) => v.status === "been");
  const tags = cafe.tagIds.map(getTagById).filter(Boolean);

  const yourRank = getUserRankForCafe(currentUserId, cafe.id, visits);
  const yourScore = getUserScoreForCafe(currentUserId, cafe.id, visits);
  const crowdScore = getCrowdScore(cafe.id, visits);
  const myVisit = visits.find((v) => v.userId === currentUserId && v.status === "been");
  const topReview = getTopReview(cafe.id, visits, users, currentUserId);

  return (
    <ScrollView className="flex-1 bg-cream">
      <Image source={{ uri: cafe.photoUrl }} className="w-full h-48" resizeMode="cover" />
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <Text
            style={{ fontFamily: FONT_SERIF_BOLD }}
            className="text-2xl text-espresso flex-1 mr-2"
          >
            {cafe.name}
          </Text>
          {yourRank !== null && yourScore !== null ? (
            <Text style={{ fontFamily: FONT_SERIF_BOLD, color: "#3F8F5C" }} className="text-2xl">
              {yourScore.toFixed(1)}
            </Text>
          ) : crowdScore !== null ? (
            <Text style={{ fontFamily: FONT_SERIF_BOLD }} className="text-2xl text-espresso/50">
              {crowdScore.toFixed(1)}
            </Text>
          ) : null}
        </View>

        <Text className="text-espresso/60 mb-2">
          {yourRank !== null ? `Your #${yourRank}` : crowdScore !== null ? `${crowdScore.toFixed(1)} crowd` : "Not yet rated"}
          {"  ·  "}
          {priceLabel(cafe.priceLevel)}
          {"  ·  "}
          {formatMiles(milesFromHome(cafe))}
          {"  ·  "}
          {isOpenNow(cafe) ? `Open til ${formatCloseHour(cafe.closeHour)}` : "Closed"}
        </Text>

        <View className="flex-row flex-wrap mb-3">
          {tags.map((tag) => (
            <TagPill key={tag!.id} tag={tag!} />
          ))}
        </View>

        {cafe.description ? (
          <Text className="text-[14px] text-espresso/75 leading-5 mb-3">{cafe.description}</Text>
        ) : null}

        {myVisit?.note ? (
          <View className="flex-row mb-4">
            <View style={{ width: 3, backgroundColor: "#D8A428", borderRadius: 2, marginRight: 10 }} />
            <Text className="flex-1 text-[15px] text-espresso/80 italic">"{myVisit.note}"</Text>
          </View>
        ) : null}

        {myVisit && myVisit.photoUrls.length > 0 && (
          <View className="flex-row mb-4" style={{ gap: 8 }}>
            {myVisit.photoUrls.slice(0, 3).map((uri, i) => (
              <Image key={`${uri}-${i}`} source={{ uri }} className="flex-1 h-20 rounded-xl" resizeMode="cover" />
            ))}
          </View>
        )}

        {topReview && (
          <View className="flex-row items-center bg-white rounded-2xl p-3 mb-4 border border-latte/30">
            <UserAvatar user={topReview.user} size={30} />
            <Text className="flex-1 ml-2.5 text-[13px] text-espresso/80">
              <Text className="font-semibold text-espresso">{topReview.user.displayName}</Text> ranks it #
              {topReview.rank} — "{topReview.note}"
            </Text>
          </View>
        )}

        <View className="flex-row items-center mb-4" style={{ gap: 8 }}>
          <Pressable
            onPress={() => router.push({ pathname: "/log/[cafeId]", params: { cafeId: cafe.id } })}
            className="flex-1 bg-espresso rounded-full py-3 items-center"
          >
            <Text className="text-cream font-semibold">Log a Visit</Text>
          </Pressable>
          <Pressable
            disabled={wantAdded}
            onPress={async () => {
              await visitRepository.addVisit({
                userId: currentUserId,
                cafeId: cafe.id,
                rating: "good",
                score: 0,
                note: "",
                tagIds: [],
                status: "want",
                photoUrls: [],
              });
              setWantAdded(true);
            }}
            className="w-12 h-12 rounded-full border border-espresso items-center justify-center"
          >
            <Ionicons name={wantAdded ? "checkmark" : "add"} size={20} color="#3D2B1F" />
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL(`https://maps.apple.com/?daddr=${cafe.lat},${cafe.lng}`)}
            className="w-12 h-12 rounded-full border border-espresso items-center justify-center"
          >
            <Ionicons name="navigate-outline" size={19} color="#3D2B1F" />
          </Pressable>
        </View>

        <Text className="text-lg font-semibold text-espresso mb-2">
          {beenVisits.length} {beenVisits.length === 1 ? "person has" : "people have"} been
        </Text>

        {beenVisits.length === 0 && (
          <Text className="text-espresso/60 mb-4">Be the first to log a visit here.</Text>
        )}

        {beenVisits.map((visit) => {
          const user = userById.get(visit.userId);
          if (!user) return null;
          return (
            <View key={visit.id} className="flex-row bg-white rounded-xl p-3 mb-2 border border-latte/40">
              <UserAvatar user={user} size={32} />
              <View className="flex-1 ml-3">
                <View className="flex-row items-center justify-between">
                  <Text className="font-semibold text-espresso">
                    {visit.userId === currentUserId ? "You" : user.displayName}
                  </Text>
                  <RatingBadge rating={visit.rating} />
                </View>
                {visit.note ? (
                  <Text className="text-sm text-espresso/70 mt-1">{visit.note}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
