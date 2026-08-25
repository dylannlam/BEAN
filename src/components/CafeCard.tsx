import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Cafe } from "../data/types";
import { getTagById } from "../lib/tags";
import { FONT_SERIF_SEMIBOLD } from "../lib/fonts";

export function priceLabel(level: Cafe["priceLevel"]) {
  return "£".repeat(level);
}

export function CafeCard({ cafe }: { cafe: Cafe }) {
  const shownTags = cafe.tagIds.slice(0, 3).map(getTagById).filter(Boolean);

  return (
    <Link href={{ pathname: "/cafe/[id]", params: { id: cafe.id } }} asChild>
      <Pressable className="flex-row bg-white rounded-2xl mb-3 overflow-hidden border border-latte/40">
        <Image source={{ uri: cafe.photoUrl }} className="w-24 h-24" resizeMode="cover" />
        <View className="flex-1 p-3">
          <View className="flex-row items-center justify-between">
            <Text
              style={{ fontFamily: FONT_SERIF_SEMIBOLD }}
              className="text-base text-espresso"
              numberOfLines={1}
            >
              {cafe.name}
            </Text>
            <Text className="text-sm text-espresso/60">{priceLabel(cafe.priceLevel)}</Text>
          </View>
          <Text className="text-sm text-espresso/60 mb-1">{cafe.neighborhood}</Text>
          <View className="flex-row flex-wrap">
            {shownTags.map((tag) => (
              <View key={tag!.id} className="flex-row items-center mr-2">
                <Ionicons
                  name={tag!.icon as keyof typeof Ionicons.glyphMap}
                  size={11}
                  color="#3D2B1FB3"
                  style={{ marginRight: 3 }}
                />
                <Text className="text-xs text-espresso/70">{tag!.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
