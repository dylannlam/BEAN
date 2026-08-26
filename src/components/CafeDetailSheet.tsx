import { useEffect, useState } from "react";
import { Image, Linking, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Cafe, NEUTRAL_CATEGORY_SCORES, User, Visit } from "../data/types";
import { visitRepository } from "../data/repositories";
import { priceLabel } from "./CafeCard";
import { TagPill } from "./TagPill";
import { UserAvatar } from "./Avatar";
import { getTagById } from "../lib/tags";
import { formatCloseHour, formatMiles, isOpenNow, milesFromHome } from "../lib/distance";
import { getCrowdScore, getTopReview, getUserRankForCafe, getUserScoreForCafe } from "../lib/cafeStats";
import { FONT_SERIF_BOLD } from "../lib/fonts";

export function CafeDetailSheet({
  cafe,
  visits,
  users,
  currentUserId,
  onClose,
  onChanged,
}: {
  cafe: Cafe | null;
  visits: Visit[];
  users: User[];
  currentUserId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [wantAdded, setWantAdded] = useState(false);
  const [displayCafe, setDisplayCafe] = useState<Cafe | null>(cafe);

  useEffect(() => {
    if (cafe) {
      setDisplayCafe(cafe);
      setWantAdded(false);
    }
  }, [cafe]);

  if (!displayCafe) return null;
  const shownCafe = displayCafe;

  const tags = shownCafe.tagIds.map(getTagById).filter((t): t is NonNullable<typeof t> => Boolean(t));
  const yourRank = getUserRankForCafe(currentUserId, shownCafe.id, visits);
  const yourScore = getUserScoreForCafe(currentUserId, shownCafe.id, visits);
  const crowdScore = getCrowdScore(shownCafe.id, visits);
  const myVisit = visits.find((v) => v.userId === currentUserId && v.cafeId === shownCafe.id && v.status === "been");
  const topReview = getTopReview(shownCafe.id, visits, users, currentUserId);
  const headlineScore = yourScore ?? crowdScore;

  return (
    <Modal visible={cafe !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(61,43,31,0.35)" }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            marginTop: "auto",
            backgroundColor: "#FFF8F0",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "78%",
            paddingTop: 10,
          }}
        >
          <View className="items-center pb-2">
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#3D2B1F30" }} />
          </View>

          <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 20 }}>
            <View className="flex-row items-start">
              <Image source={{ uri: shownCafe.photoUrl }} className="w-16 h-16 rounded-xl" resizeMode="cover" />
              <View className="flex-1 ml-3">
                <Text
                  style={{ fontFamily: FONT_SERIF_BOLD }}
                  className="text-lg text-espresso"
                  numberOfLines={1}
                >
                  {shownCafe.name}
                </Text>
                <Text className="text-xs text-espresso/50 mt-0.5">
                  {yourRank !== null ? `Your #${yourRank}` : crowdScore !== null ? `${crowdScore.toFixed(1)} crowd` : "Not yet rated"}
                  {"  ·  "}
                  {priceLabel(shownCafe.priceLevel)}
                  {"  ·  "}
                  {formatMiles(milesFromHome(shownCafe))}
                  {"  ·  "}
                  {isOpenNow(shownCafe) ? `open til ${formatCloseHour(shownCafe.closeHour)}` : "closed"}
                </Text>
              </View>
              {headlineScore !== null && (
                <Text style={{ fontFamily: FONT_SERIF_BOLD }} className="text-2xl text-espresso ml-2">
                  {headlineScore.toFixed(1)}
                </Text>
              )}
            </View>

            {tags.length > 0 && (
              <View className="flex-row flex-wrap mt-3">
                {tags.map((tag) => (
                  <TagPill key={tag.id} tag={tag} />
                ))}
              </View>
            )}

            {shownCafe.description ? (
              <Text className="text-[13px] text-espresso/70 leading-5 mt-2">{shownCafe.description}</Text>
            ) : null}

            {myVisit?.note ? (
              <View className="flex-row mt-3">
                <View style={{ width: 3, backgroundColor: "#D8A428", borderRadius: 2, marginRight: 10 }} />
                <Text className="flex-1 text-[14px] text-espresso/80 italic">"{myVisit.note}"</Text>
              </View>
            ) : null}

            {myVisit && myVisit.photoUrls.length > 0 && (
              <View className="flex-row mt-3" style={{ gap: 8 }}>
                {myVisit.photoUrls.slice(0, 3).map((uri, i) => (
                  <Image key={`${uri}-${i}`} source={{ uri }} className="flex-1 h-16 rounded-xl" resizeMode="cover" />
                ))}
              </View>
            )}

            {topReview && (
              <View className="flex-row items-center bg-white rounded-2xl p-3 mt-3 border border-latte/30">
                <UserAvatar user={topReview.user} size={28} />
                <Text className="flex-1 ml-2.5 text-[13px] text-espresso/80">
                  <Text className="font-semibold text-espresso">{topReview.user.displayName}</Text> ranks it #
                  {topReview.rank} — "{topReview.note}"
                </Text>
              </View>
            )}

            <View className="flex-row items-center mt-4" style={{ gap: 8 }}>
              <Pressable
                onPress={() => {
                  onClose();
                  router.push({ pathname: "/log/[cafeId]", params: { cafeId: shownCafe.id } });
                }}
                className="flex-1 bg-espresso rounded-full py-3 items-center"
              >
                <Text className="text-cream font-semibold">Log a Visit</Text>
              </Pressable>
              <Pressable
                disabled={wantAdded}
                onPress={async () => {
                  await visitRepository.addVisit({
                    userId: currentUserId,
                    cafeId: shownCafe.id,
                    rating: "good",
                    score: 0,
                    categoryScores: NEUTRAL_CATEGORY_SCORES,
                    note: "",
                    tagIds: [],
                    status: "want",
                    photoUrls: [],
                  });
                  setWantAdded(true);
                  onChanged();
                }}
                className="w-12 h-12 rounded-full border border-espresso items-center justify-center"
              >
                <Ionicons name={wantAdded ? "checkmark" : "add"} size={20} color="#3D2B1F" />
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL(`https://maps.apple.com/?daddr=${shownCafe.lat},${shownCafe.lng}`)}
                className="w-12 h-12 rounded-full border border-espresso items-center justify-center"
              >
                <Ionicons name="navigate-outline" size={19} color="#3D2B1F" />
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                onClose();
                router.push({ pathname: "/cafe/[id]", params: { id: shownCafe.id } });
              }}
              className="items-center py-3 mt-1"
            >
              <Text className="text-espresso/50 text-xs font-medium">See full details</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
