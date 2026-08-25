import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tag } from "../data/types";

export function TagPill({
  tag,
  selected = false,
  onPress,
}: {
  tag: Tag;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center rounded-full border px-3 py-1.5 mr-2 mb-2 ${
        selected ? "bg-espresso border-espresso" : "bg-white border-latte"
      }`}
    >
      <Ionicons
        name={tag.icon as keyof typeof Ionicons.glyphMap}
        size={14}
        color={selected ? "#FFF8F0" : "#3D2B1F"}
        style={{ marginRight: 5 }}
      />
      <Text className={`text-sm ${selected ? "text-cream" : "text-espresso"}`}>{tag.label}</Text>
    </Pressable>
  );
}
