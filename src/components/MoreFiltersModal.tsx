import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TagPill } from "./TagPill";
import { priceLabel } from "./CafeCard";
import { TAG_CATEGORY_LABEL, groupTagsByCategory } from "../lib/tags";
import { PriceLevel } from "../data/types";

const PRICE_LEVELS: PriceLevel[] = [1, 2, 3];

export function MoreFiltersModal({
  visible,
  onClose,
  selectedTagIds,
  toggleTag,
  maxPrice,
  setMaxPrice,
  onClear,
}: {
  visible: boolean;
  onClose: () => void;
  selectedTagIds: string[];
  toggleTag: (tagId: string) => void;
  maxPrice: PriceLevel | null;
  setMaxPrice: (price: PriceLevel | null) => void;
  onClear: () => void;
}) {
  const groupedTags = groupTagsByCategory();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(61,43,31,0.35)" }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            marginTop: "auto",
            backgroundColor: "#FFF8F0",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "75%",
            paddingTop: 12,
          }}
        >
          <View className="flex-row items-center justify-between px-4 pb-3">
            <Text className="text-lg font-bold text-espresso">Filters</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color="#3D2B1F" />
            </Pressable>
          </View>

          <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 24 }}>
            {(Object.keys(groupedTags) as (keyof typeof groupedTags)[]).map((category) => (
              <View key={category} className="mb-3">
                <Text className="text-xs font-semibold text-espresso/60 mb-1 uppercase">
                  {TAG_CATEGORY_LABEL[category]}
                </Text>
                <View className="flex-row flex-wrap">
                  {groupedTags[category].map((tag) => (
                    <TagPill
                      key={tag.id}
                      tag={tag}
                      selected={selectedTagIds.includes(tag.id)}
                      onPress={() => toggleTag(tag.id)}
                    />
                  ))}
                </View>
              </View>
            ))}

            <Text className="text-xs font-semibold text-espresso/60 mb-1 uppercase">Price</Text>
            <View className="flex-row flex-wrap mb-3">
              {PRICE_LEVELS.map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setMaxPrice(maxPrice === level ? null : level)}
                  className={`rounded-full border px-3 py-1.5 mr-2 mb-2 ${
                    maxPrice === level ? "bg-espresso border-espresso" : "bg-white border-latte"
                  }`}
                >
                  <Text className={maxPrice === level ? "text-cream" : "text-espresso"}>
                    {priceLabel(level)} or less
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={onClear}>
              <Text className="text-accent text-sm font-semibold">Clear all filters</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
