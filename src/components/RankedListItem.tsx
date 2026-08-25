import { Image, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { Cafe, Tag } from "../data/types";
import { priceLabel } from "./CafeCard";
import { scoreColor } from "../lib/score";
import { FONT_SERIF_BOLD, FONT_SERIF_SEMIBOLD } from "../lib/fonts";

export function RankedListItem({
  rank,
  cafe,
  tags,
  score,
}: {
  rank?: number;
  cafe: Cafe;
  tags: Tag[];
  score: number;
}) {
  return (
    <Link href={{ pathname: "/cafe/[id]", params: { id: cafe.id } }} asChild>
      <Pressable className="flex-row bg-white rounded-2xl mb-3 p-2.5 border border-latte/30">
        {rank !== undefined && (
          <View className="w-6 items-center justify-center">
            <Text style={{ fontFamily: FONT_SERIF_SEMIBOLD }} className="text-base text-espresso/40">
              {rank}
            </Text>
          </View>
        )}

        <Image source={{ uri: cafe.photoUrl }} className="w-16 h-16 rounded-xl" resizeMode="cover" />

        <View className="flex-1 ml-3 justify-center">
          <Text
            style={{ fontFamily: FONT_SERIF_SEMIBOLD }}
            className="text-[15px] text-espresso"
            numberOfLines={1}
          >
            {cafe.name}
          </Text>
          <View className="flex-row flex-wrap mt-1" style={{ gap: 6 }}>
            {tags.slice(0, 3).map((tag) => (
              <View key={tag.id} className="rounded-full border border-latte px-2 py-0.5 bg-cream">
                <Text className="text-[11px] text-espresso/80">{tag.label}</Text>
              </View>
            ))}
          </View>
          <View className="h-1 rounded-full bg-latte/25 overflow-hidden mt-2 mr-8">
            <View
              className="h-1 rounded-full"
              style={{ width: `${score * 10}%`, backgroundColor: scoreColor(score) }}
            />
          </View>
        </View>

        <View className="items-end justify-between">
          <View className="rounded-full bg-green-100 px-2 py-0.5">
            <Text className="text-[11px] font-semibold text-green-800">
              {priceLabel(cafe.priceLevel)}
            </Text>
          </View>
          <Text style={{ color: scoreColor(score), fontFamily: FONT_SERIF_BOLD }} className="text-sm">
            {score.toFixed(1)}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
