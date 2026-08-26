import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { Cafe, User, Visit } from "../data/types";
import { UserAvatar } from "./Avatar";
import { scoreColor } from "../lib/score";
import { FONT_SANS, FONT_SANS_MEDIUM, FONT_SANS_SEMIBOLD, FONT_SERIF_BOLD, FONT_SERIF_SEMIBOLD } from "../lib/fonts";

const INK = "#3D2B1F";
const INK_MUTED = "#8A7A6D";
const INK_FAINT = "#B3A594";

function timeAgo(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export function VisitCard({
  visit,
  cafe,
  user,
  currentUserId,
  reactedUsers,
  commentCount = 0,
  onToggleLike,
}: {
  visit: Visit;
  cafe: Cafe;
  user: User;
  currentUserId: string;
  reactedUsers: User[];
  commentCount?: number;
  onToggleLike?: (visitId: string) => void;
}) {
  const liked = visit.likeUserIds.includes(currentUserId);
  const photos = visit.photoUrls;
  const hasPhotos = photos.length > 0;
  const shownAvatars = reactedUsers.slice(0, 2);
  const overflowCount = reactedUsers.length - shownAvatars.length;
  const hasScore = visit.status === "been" && visit.score > 0;

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        marginBottom: 18,
        padding: 16,
        shadowColor: "#2A1B10",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Pressable
          onPress={() => router.push({ pathname: "/user/[id]", params: { id: user.id } })}
          className="flex-row items-center flex-1"
        >
          <UserAvatar user={user} size={32} />
          <View className="ml-2.5">
            <Text style={{ color: INK, fontSize: 14.5, fontFamily: FONT_SANS_SEMIBOLD }}>
              {user.displayName}
            </Text>
            <Text style={{ color: INK_FAINT, fontSize: 11.5, marginTop: 1, fontFamily: FONT_SANS_MEDIUM }}>
              {timeAgo(visit.createdAt)}
            </Text>
          </View>
        </Pressable>

        {hasScore && (
          <View className="items-end">
            <Text
              style={{
                fontFamily: FONT_SERIF_BOLD,
                fontSize: 20,
                color: scoreColor(visit.score),
                lineHeight: 22,
              }}
            >
              {visit.score.toFixed(1)}
            </Text>
            <View style={{ width: 34, height: 3, borderRadius: 2, backgroundColor: "#EEE4D6", marginTop: 3, overflow: "hidden" }}>
              <View
                style={{
                  width: `${visit.score * 10}%`,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: scoreColor(visit.score),
                }}
              />
            </View>
          </View>
        )}
      </View>

      <Link href={{ pathname: "/cafe/[id]", params: { id: cafe.id } }} asChild>
        <Pressable>
          <Text style={{ fontSize: 15.5, color: INK, marginBottom: visit.note && hasPhotos ? 4 : 10, fontFamily: FONT_SERIF_SEMIBOLD }}>
            {cafe.name}
            {cafe.neighborhood ? (
              <Text style={{ color: INK_MUTED, fontFamily: FONT_SANS_MEDIUM, fontSize: 13 }}>{`  ·  ${cafe.neighborhood}`}</Text>
            ) : null}
          </Text>

          {visit.note ? (
            <Text
              style={{
                fontSize: 14.5,
                color: "#5A4A3D",
                lineHeight: 20,
                marginBottom: 12,
                fontFamily: FONT_SANS,
              }}
            >
              {visit.note}
            </Text>
          ) : null}

          {hasPhotos && <PhotoCluster photos={photos} />}
        </Pressable>
      </Link>

      {reactedUsers.length > 0 && (
        <View className="flex-row items-center mt-3">
          {shownAvatars.map((u, i) => (
            <View key={u.id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: shownAvatars.length - i }}>
              <View style={{ borderWidth: 2, borderColor: "#FFFFFF", borderRadius: 999 }}>
                <UserAvatar user={u} size={22} />
              </View>
            </View>
          ))}
          {overflowCount > 0 && (
            <View style={{ marginLeft: -8, borderWidth: 2, borderColor: "#FFFFFF", borderRadius: 999 }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: "#EEE4D6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 9.5, fontWeight: "700", color: INK }}>+{overflowCount}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 14,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: "#F1E9DC",
        }}
      >
        <View className="flex-row items-center" style={{ gap: 20 }}>
          <Pressable onPress={() => onToggleLike?.(visit.id)} hitSlop={8} className="flex-row items-center">
            <Ionicons name={liked ? "heart" : "heart-outline"} size={19} color={liked ? "#E85D3D" : INK_FAINT} />
            {visit.likeUserIds.length > 0 && (
              <Text style={{ fontSize: 12, color: INK_MUTED, marginLeft: 5 }}>{visit.likeUserIds.length}</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: "/comments/[visitId]", params: { visitId: visit.id } })}
            hitSlop={8}
            className="flex-row items-center"
          >
            <Ionicons name="chatbubble-outline" size={17} color={INK_FAINT} />
            {commentCount > 0 && (
              <Text style={{ fontSize: 12, color: INK_MUTED, marginLeft: 5 }}>{commentCount}</Text>
            )}
          </Pressable>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: "/cafe/[id]", params: { id: cafe.id } })}
          hitSlop={8}
        >
          <Ionicons name="map-outline" size={18} color={INK_FAINT} />
        </Pressable>
      </View>
    </View>
  );
}

function PhotoCluster({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  if (photos.length === 1) {
    return <Image source={{ uri: photos[0] }} style={{ width: "100%", height: 160, borderRadius: 14 }} resizeMode="cover" />;
  }

  const [hero, ...rest] = photos.slice(0, 3);
  return (
    <View style={{ flexDirection: "row", height: 140, gap: 5 }}>
      <Image source={{ uri: hero }} style={{ flex: 1.4, height: "100%", borderRadius: 14 }} resizeMode="cover" />
      <View style={{ flex: 1, gap: 5 }}>
        {rest.map((uri, i) => (
          <Image
            key={`${uri}-${i}`}
            source={{ uri }}
            style={{ flex: 1, width: "100%", borderRadius: 14 }}
            resizeMode="cover"
          />
        ))}
      </View>
    </View>
  );
}
