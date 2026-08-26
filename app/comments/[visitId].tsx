import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { cafeRepository, commentRepository, userRepository, visitRepository } from "../../src/data/repositories";
import { useAsync } from "../../src/lib/useAsync";
import { useSessionStore } from "../../src/store/session";
import { UserAvatar } from "../../src/components/Avatar";
import { Comment } from "../../src/data/types";

function timeAgo(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export default function CommentsScreen() {
  const { visitId } = useLocalSearchParams<{ visitId: string }>();
  const currentUserId = useSessionStore((s) => s.currentUserId);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const { data, loading, reload } = useAsync(async () => {
    const [visits, users, visitComments] = await Promise.all([
      visitRepository.listVisits(),
      userRepository.listUsers(),
      commentRepository.listCommentsForVisit(visitId),
    ]);
    const visit = visits.find((v) => v.id === visitId);
    const cafe = visit ? await cafeRepository.getCafe(visit.cafeId) : undefined;
    return { visit, cafe, users, comments: visitComments };
  }, [visitId]);

  const userById = useMemo(() => new Map(data?.users.map((u) => [u.id, u])), [data]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    await commentRepository.addComment({ visitId, userId: currentUserId, text });
    setDraft("");
    await reload();
    setPosting(false);
  };

  if (loading || !data) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <SafeAreaView edges={["bottom"]} className="flex-1 bg-cream">
        {data.cafe && (
          <View className="px-4 pt-3 pb-3 border-b border-latte/40">
            <Text className="text-espresso/50 text-xs uppercase font-semibold">Comments on</Text>
            <Text className="text-espresso font-bold text-base">{data.cafe.name}</Text>
          </View>
        )}

        <FlatList
          data={data.comments}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          renderItem={({ item }: { item: Comment }) => {
            const user = userById.get(item.userId);
            if (!user) return null;
            return (
              <View className="flex-row mb-4">
                <UserAvatar user={user} size={30} />
                <View className="flex-1 ml-2.5">
                  <View className="flex-row items-baseline">
                    <Text className="text-espresso font-semibold text-[13.5px]">{user.displayName}</Text>
                    <Text className="text-espresso/40 text-[11px] ml-2">{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text className="text-espresso/80 text-[14px] mt-0.5">{item.text}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-espresso/50">No comments yet — be the first to say something.</Text>
            </View>
          }
        />

        <View className="flex-row items-center px-4 py-3 border-t border-latte/40 bg-cream">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a comment…"
            placeholderTextColor="#3D2B1F80"
            className="flex-1 bg-white rounded-full px-4 py-2.5 border border-latte text-espresso mr-2"
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={posting || !draft.trim()}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              draft.trim() && !posting ? "bg-accent" : "bg-latte/40"
            }`}
          >
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
