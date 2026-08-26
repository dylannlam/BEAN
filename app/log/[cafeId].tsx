import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { cafeRepository, visitRepository } from "../../src/data/repositories";
import { useAsync } from "../../src/lib/useAsync";
import { useSessionStore } from "../../src/store/session";
import { TagPill } from "../../src/components/TagPill";
import { CategorySlider } from "../../src/components/CategorySlider";
import { TAG_CATEGORY_LABEL, groupTagsByCategory } from "../../src/lib/tags";
import { CATEGORY_KEYS, CATEGORY_LABELS, Cafe, CategoryScores, NEUTRAL_CATEGORY_SCORES } from "../../src/data/types";
import { deriveRating, scoreColor, scoreFromCategories, totalOutOf100 } from "../../src/lib/score";
import {
  ComparisonRange,
  applyComparison,
  initialRange,
  interpolateScore,
  isRankingDone,
  nextComparisonVisit,
} from "../../src/lib/ranking";

type Step = "rate" | "compare" | "details";

export default function LogVisitScreen() {
  const { cafeId } = useLocalSearchParams<{ cafeId: string }>();
  const currentUserId = useSessionStore((s) => s.currentUserId);

  const [step, setStep] = useState<Step>("rate");
  const [categoryScores, setCategoryScores] = useState<CategoryScores>(NEUTRAL_CATEGORY_SCORES);
  const [range, setRange] = useState<ComparisonRange>({ low: 0, high: 0 });
  const [compareCafe, setCompareCafe] = useState<Cafe | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data, loading } = useAsync(async () => {
    const [cafe, visits] = await Promise.all([
      cafeRepository.getCafe(cafeId),
      visitRepository.listVisits(),
    ]);
    return { cafe, visits };
  }, [cafeId]);

  const groupedTags = groupTagsByCategory();

  // Other cafes this user has already ranked — excludes this cafe itself, so
  // re-logging a visit never compares it against its own prior visit.
  const rankedVisits = useMemo(() => {
    if (!data) return [];
    return data.visits
      .filter((v) => v.userId === currentUserId && v.status === "been" && v.cafeId !== cafeId)
      .sort((a, b) => b.score - a.score);
  }, [data, currentUserId, cafeId]);

  const rawScore = useMemo(() => scoreFromCategories(categoryScores), [categoryScores]);

  useEffect(() => {
    if (step !== "compare") return;
    const target = nextComparisonVisit(rankedVisits, range);
    if (!target) return;
    let cancelled = false;
    setLoadingCompare(true);
    cafeRepository.getCafe(target.cafeId).then((c) => {
      if (!cancelled) {
        setCompareCafe(c ?? null);
        setLoadingCompare(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [step, range, rankedVisits]);

  const handleStartCompare = () => {
    if (rankedVisits.length === 0) {
      setFinalScore(rawScore);
      setStep("details");
      return;
    }
    setRange(initialRange(rankedVisits));
    setStep("compare");
  };

  const handleCompareAnswer = (newCafeWasBetter: boolean) => {
    const nextRange = applyComparison(range, newCafeWasBetter);
    if (isRankingDone(nextRange)) {
      setFinalScore(interpolateScore(rankedVisits, nextRange.low, rawScore));
      setStep("details");
    } else {
      setRange(nextRange);
    }
  };

  const toggleTag = (tagId: string) =>
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );

  const MAX_PHOTOS = 6;

  const handleAddPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to add photos to your review.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, MAX_PHOTOS - photoUrls.length),
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    setUploadingPhotos(true);
    try {
      const uploaded = await Promise.all(
        result.assets.map((asset) => visitRepository.uploadVisitPhoto(currentUserId, asset.uri))
      );
      setPhotoUrls((prev) => [...prev, ...uploaded].slice(0, MAX_PHOTOS));
    } catch {
      Alert.alert("Upload failed", "Couldn't add one or more photos. Try again.");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleRemovePhoto = (uri: string) =>
    setPhotoUrls((prev) => prev.filter((u) => u !== uri));

  const handleSubmit = async () => {
    setSubmitting(true);
    await visitRepository.addVisit({
      userId: currentUserId,
      cafeId,
      rating: deriveRating(finalScore),
      score: finalScore,
      categoryScores,
      note,
      tagIds: selectedTagIds,
      status: "been",
      photoUrls,
    });
    setSubmitting(false);
    router.back();
  };

  if (loading || !data?.cafe) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator />
      </View>
    );
  }
  const cafe = data.cafe;

  if (step === "rate") {
    return (
      <ScrollView className="flex-1 bg-cream p-4">
        <Text className="text-xl font-bold text-espresso mb-1">{cafe.name}</Text>
        <Text className="text-espresso/60 mb-1">{cafe.neighborhood}</Text>
        <View className="flex-row justify-between items-baseline mb-5 mt-3">
          <Text className="text-sm font-semibold text-espresso/60 uppercase">Rate every category</Text>
          <Text className="text-base font-bold" style={{ color: scoreColor(rawScore) }}>
            {totalOutOf100(categoryScores).toFixed(2)} / 100
          </Text>
        </View>

        {CATEGORY_KEYS.map((key) => (
          <CategorySlider
            key={key}
            label={CATEGORY_LABELS[key]}
            value={categoryScores[key]}
            onChange={(v) => setCategoryScores((prev) => ({ ...prev, [key]: v }))}
          />
        ))}

        <Pressable onPress={handleStartCompare} className="rounded-xl py-3 items-center mb-8 bg-accent mt-2">
          <Text className="text-white font-semibold">
            {rankedVisits.length > 0 ? "Next: Compare with your cafes" : "Continue"}
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (step === "compare") {
    return (
      <View className="flex-1 bg-cream p-4">
        <Pressable onPress={() => setStep("rate")} className="flex-row items-center mb-4 self-start">
          <Ionicons name="chevron-back" size={16} color="#3D2B1F" />
          <Text className="text-espresso text-sm ml-1">Back to ratings</Text>
        </Pressable>

        <Text className="text-sm font-semibold text-espresso/60 uppercase mb-1">Which was better?</Text>
        <Text className="text-espresso/50 mb-6 text-xs">
          Comparing against your ranked cafes to place {cafe.name} precisely.
        </Text>

        {loadingCompare || !compareCafe ? (
          <ActivityIndicator className="mt-10" />
        ) : (
          <View className="flex-1 justify-center">
            <Pressable
              onPress={() => handleCompareAnswer(true)}
              className="bg-white rounded-2xl p-5 mb-4 border-2 border-latte/40 items-center"
            >
              <Image source={{ uri: cafe.photoUrl }} className="w-full h-28 rounded-xl mb-3" resizeMode="cover" />
              <Text className="text-lg font-bold text-espresso">{cafe.name}</Text>
              <Text className="text-espresso/50 text-xs">{cafe.neighborhood}</Text>
            </Pressable>

            <Text className="text-center text-espresso/40 text-xs font-semibold mb-4">VS</Text>

            <Pressable
              onPress={() => handleCompareAnswer(false)}
              className="bg-white rounded-2xl p-5 mb-2 border-2 border-latte/40 items-center"
            >
              <Image
                source={{ uri: compareCafe.photoUrl }}
                className="w-full h-28 rounded-xl mb-3"
                resizeMode="cover"
              />
              <Text className="text-lg font-bold text-espresso">{compareCafe.name}</Text>
              <Text className="text-espresso/50 text-xs">{compareCafe.neighborhood}</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-cream p-4">
      <Pressable
        onPress={() => setStep(rankedVisits.length > 0 ? "compare" : "rate")}
        className="flex-row items-center mb-4 self-start"
      >
        <Ionicons name="chevron-back" size={16} color="#3D2B1F" />
        <Text className="text-espresso text-sm ml-1">Back</Text>
      </Pressable>

      <Text className="text-xl font-bold text-espresso mb-1">{cafe.name}</Text>
      <Text className="text-espresso/60 mb-4">{cafe.neighborhood}</Text>

      <View className="bg-white rounded-2xl border border-latte/40 p-4 mb-4 items-center">
        <Text className="text-xs font-semibold text-espresso/50 uppercase mb-1">Your Score</Text>
        <Text className="text-3xl font-bold" style={{ color: scoreColor(finalScore) }}>
          {finalScore.toFixed(2)}
          <Text className="text-base text-espresso/40"> / 10</Text>
        </Text>
        <Text className="text-espresso/50 text-xs mt-1">
          {totalOutOf100(categoryScores).toFixed(1)} / 100 from your category ratings
        </Text>
      </View>

      <Text className="text-sm font-semibold text-espresso/60 mb-2 uppercase">What was it good for?</Text>
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

      <Text className="text-sm font-semibold text-espresso/60 mb-2 uppercase">Photos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-4 px-4">
        <View className="flex-row">
          {photoUrls.map((uri) => (
            <View key={uri} className="relative mr-2.5">
              <Image source={{ uri }} className="w-20 h-20 rounded-xl" resizeMode="cover" />
              <Pressable
                onPress={() => handleRemovePhoto(uri)}
                className="absolute -top-1.5 -right-1.5 bg-espresso rounded-full w-5 h-5 items-center justify-center"
              >
                <Ionicons name="close" size={12} color="#FFF8F0" />
              </Pressable>
            </View>
          ))}
          {photoUrls.length < MAX_PHOTOS && (
            <Pressable
              onPress={handleAddPhotos}
              disabled={uploadingPhotos}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-latte items-center justify-center bg-white"
            >
              {uploadingPhotos ? (
                <ActivityIndicator size="small" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={20} color="#3D2B1F80" />
                  <Text className="text-espresso/50 text-[10px] mt-1">Add</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>

      <Pressable
        disabled={submitting}
        onPress={handleSubmit}
        className={`rounded-xl py-3 items-center mb-8 ${submitting ? "bg-latte/40" : "bg-accent"}`}
      >
        <Text className="text-white font-semibold">{submitting ? "Saving…" : "Save Visit"}</Text>
      </Pressable>
    </ScrollView>
  );
}
