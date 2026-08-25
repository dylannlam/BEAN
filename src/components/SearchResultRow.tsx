import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Cafe } from "../data/types";
import { formatMiles } from "../lib/distance";
import { FONT_SERIF_SEMIBOLD } from "../lib/fonts";

export function SearchResultRow({
  cafe,
  distanceMiles,
  yourRank,
  yourScore,
  crowdScore,
  visited,
  onQuickAdd,
}: {
  cafe: Cafe;
  distanceMiles: number;
  yourRank: number | null;
  yourScore: number | null;
  crowdScore: number | null;
  visited: boolean;
  onQuickAdd: () => void;
}) {
  const parts = [formatMiles(distanceMiles)];
  if (yourRank !== null && yourScore !== null) {
    parts.push(`your #${yourRank}`, yourScore.toFixed(1));
  } else if (crowdScore !== null) {
    parts.push(`${crowdScore.toFixed(1)} crowd`);
  }

  return (
    <Link href={{ pathname: "/cafe/[id]", params: { id: cafe.id } }} asChild>
      <Pressable className="flex-row items-center bg-white rounded-2xl mb-3 p-2.5 border border-latte/30">
        <Image source={{ uri: cafe.photoUrl }} className="w-14 h-14 rounded-xl" resizeMode="cover" />
        <View className="flex-1 ml-3">
          <Text
            style={{ fontFamily: FONT_SERIF_SEMIBOLD }}
            className="text-[15px] text-espresso"
            numberOfLines={1}
          >
            {cafe.name}
          </Text>
          <Text className="text-xs text-espresso/50 mt-0.5">{parts.join("  ·  ")}</Text>
        </View>

        {visited ? (
          <Ionicons name="chevron-forward" size={18} color="#3D2B1F66" />
        ) : (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onQuickAdd();
            }}
            hitSlop={8}
            className="w-8 h-8 rounded-full border border-espresso items-center justify-center"
          >
            <Ionicons name="add" size={16} color="#3D2B1F" />
          </Pressable>
        )}
      </Pressable>
    </Link>
  );
}
