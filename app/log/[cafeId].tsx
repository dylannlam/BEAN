import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { cafeRepository, visitRepository } from "../../src/data/repositories";
import { useAsync } from "../../src/lib/useAsync";
import { useSessionStore } from "../../src/store/session";
import { TagPill } from "../../src/components/TagPill";
import { TAG_CATEGORY_LABEL, groupTagsByCategory } from "../../src/lib/tags";
import { RATING_LABEL, RATING_SCORE, RatingValue } from "../../src/data/types";

const RATINGS: RatingValue[] = ["good", "fine", "bad"];

export default function LogVisitScreen() {
  const { cafeId } = useLocalSearchParams<{ cafeId: string }>();
  const currentUserId = useSessionStore((s) => s.currentUserId);
  const [rating, setRating] = useState<RatingValue | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: cafe, loading } = useAsync(() => cafeRepository.getCafe(cafeId), [cafeId]);
  const groupedTags = groupTagsByCategory();

  const toggleTag = (tagId: string) =>
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );

  const canSubmit = rating !== null && !submitting;

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    await visitRepository.addVisit({
      userId: currentUserId,
      cafeId,
      rating,
      score: RATING_SCORE[rating],
      note,
      tagIds: selectedTagIds,
      status: "been",
      photoUrls: [],
    });
    setSubmitting(false);
    router.back();
  };

  if (loading || !cafe) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-cream p-4">
      <Text className="text-xl font-bold text-espresso mb-1">{cafe.name}</Text>
      <Text className="text-espresso/60 mb-4">{cafe.neighborhood}</Text>

      <Text className="text-sm font-semibold text-espresso/60 mb-2 uppercase">How was it?</Text>
      <View className="flex-row mb-4">
        {RATINGS.map((r) => (
          <Pressable
            key={r}
            onPress={() => setRating(r)}
            className={`flex-1 py-3 rounded-xl mr-2 items-center border ${
              rating === r ? "bg-espresso border-espresso" : "bg-white border-latte"
            }`}
          >
            <Text className={rating === r ? "text-cream font-semibold" : "text-espresso"}>
              {RATING_LABEL[r]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-sm font-semibold text-espresso/60 mb-2 uppercase">
        What was it good for?
      </Text>
      {(Object.keys(groupedTags) as (keyof typeof groupedTags)[]).map((category) => (
        <View key={category} className="mb-2">
          <Text className="text-xs text-espresso/50 mb-1">{TAG_CATEGORY_LABEL[category]}</Text>
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

      <Text className="text-sm font-semibold text-espresso/60 mb-2 mt-2 uppercase">Notes</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="What did you order? Would you go back?"
        placeholderTextColor="#3D2B1F80"
        multiline
        className="bg-white rounded-xl px-4 py-3 border border-latte text-espresso mb-6 h-24"
        textAlignVertical="top"
      />

      <Pressable
        disabled={!canSubmit}
        onPress={handleSubmit}
        className={`rounded-xl py-3 items-center mb-8 ${
          canSubmit ? "bg-accent" : "bg-latte/40"
        }`}
      >
        <Text className="text-white font-semibold">
          {submitting ? "Saving…" : "Save Visit"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
