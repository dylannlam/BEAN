import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { cafeRepository, visitRepository } from "../../src/data/repositories";
import { useAsync } from "../../src/lib/useAsync";
import { useSessionStore } from "../../src/store/session";
import { CafeCard } from "../../src/components/CafeCard";
import { RankedListItem } from "../../src/components/RankedListItem";
import { Logo } from "../../src/components/Logo";
import { FONT_SERIF_BOLD } from "../../src/lib/fonts";
import { TAGS, getTagById, joinActivityLabels } from "../../src/lib/tags";
import { Visit } from "../../src/data/types";

type StatusFilter = "been" | "want";

export default function OurListScreen() {
  const currentUserId = useSessionStore((s) => s.currentUserId);
  const [status, setStatus] = useState<StatusFilter>("been");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const toggleTag = (tagId: string) =>
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );

  const { data, loading } = useAsync(async () => {
    const [visits, cafes] = await Promise.all([
      visitRepository.listVisitsByUser(currentUserId),
      cafeRepository.listCafes(),
    ]);
    return { visits, cafes };
  }, [currentUserId]);

  const statusVisits = useMemo(() => {
    if (!data) return [] as Visit[];
    return data.visits.filter((v) => v.status === status);
  }, [data, status]);

  const filteredVisits = useMemo(() => {
    const list =
      selectedTagIds.length > 0
        ? statusVisits.filter((v) => selectedTagIds.some((t) => v.tagIds.includes(t)))
        : statusVisits;
    return [...list].sort((a, b) => b.score - a.score);
  }, [statusVisits, selectedTagIds]);

  const selectedTags = selectedTagIds.map(getTagById).filter((t): t is NonNullable<typeof t> => Boolean(t));

  if (loading || !data) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const cafeById = new Map(data.cafes.map((c) => [c.id, c]));

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
      <View className="px-4 pt-2 pb-2">
        <View className="mb-3">
          <Logo size={22} textSize={17} />
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text style={{ fontFamily: FONT_SERIF_BOLD }} className="text-2xl text-espresso">
            Your List
          </Text>
          <View className="flex-row bg-white rounded-full border border-latte p-0.5">
            {(["been", "want"] as StatusFilter[]).map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-full ${status === s ? "bg-espresso" : ""}`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    status === s ? "text-cream" : "text-espresso/60"
                  }`}
                >
                  {s === "been" ? "Been" : "Want to Try"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: "row", alignItems: "center" }}
          style={{ flexGrow: 0, flexShrink: 0, height: 48 }}
        >
          <Pressable
            onPress={() => setSelectedTagIds([])}
            className={`rounded-full border px-3 py-1.5 mr-2 ${
              selectedTagIds.length === 0 ? "bg-accent border-accent" : "bg-white border-latte"
            }`}
          >
            <Text className={selectedTagIds.length === 0 ? "text-white font-semibold text-sm" : "text-espresso text-sm"}>
              All
            </Text>
          </Pressable>
          {TAGS.map((tag) => {
            const selected = selectedTagIds.includes(tag.id);
            return (
              <Pressable
                key={tag.id}
                onPress={() => toggleTag(tag.id)}
                className={`rounded-full border px-3 py-1.5 mr-2 ${
                  selected ? "bg-accent border-accent" : "bg-white border-latte"
                }`}
              >
                <Text className={selected ? "text-white font-semibold text-sm" : "text-espresso text-sm"}>
                  {tag.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text className="text-espresso/50 text-xs mt-2">
          {status === "been"
            ? selectedTags.length > 0
              ? `you have ${filteredVisits.length} option${filteredVisits.length === 1 ? "" : "s"} for ${joinActivityLabels(selectedTags)}`
              : `${filteredVisits.length} cafe${filteredVisits.length === 1 ? "" : "s"} rated`
            : `${filteredVisits.length} cafe${filteredVisits.length === 1 ? "" : "s"} on your want-to-try list`}
        </Text>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        data={filteredVisits}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const cafe = cafeById.get(item.cafeId);
          if (!cafe) return null;
          if (status === "want") {
            return <CafeCard cafe={cafe} />;
          }
          const tags = item.tagIds.map(getTagById).filter((t): t is NonNullable<typeof t> => Boolean(t));
          return <RankedListItem rank={index + 1} cafe={cafe} tags={tags} score={item.score} />;
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-espresso/60">Nothing here yet — try a different filter.</Text>
          </View>
        }
      />

      <View className="px-4 pb-4">
        <Pressable
          onPress={() => router.push("/(tabs)/search")}
          className="bg-espresso rounded-full py-3 items-center"
        >
          <Text className="text-cream font-semibold">Rate a new shop</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
