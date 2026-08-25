import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { User } from "../data/types";
import { UserAvatar } from "./Avatar";

export function PersonRow({
  user,
  isFollowing,
  pending = false,
  onToggleFollow,
}: {
  user: User;
  isFollowing: boolean;
  pending?: boolean;
  onToggleFollow: () => void;
}) {
  return (
    <Link href={{ pathname: "/user/[id]", params: { id: user.id } }} asChild>
      <Pressable className="flex-row items-center bg-white rounded-2xl mb-3 p-3 border border-latte/30">
        <UserAvatar user={user} size={40} />
        <View className="flex-1 ml-3">
          <Text className="text-[15px] font-semibold text-espresso">{user.displayName}</Text>
          <Text className="text-xs text-espresso/50">@{user.username}</Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onToggleFollow();
          }}
          disabled={pending}
          className={`rounded-full px-3 py-1.5 ${
            isFollowing ? "bg-white border border-espresso" : "bg-espresso"
          }`}
        >
          <Text className={`text-xs font-semibold ${isFollowing ? "text-espresso" : "text-cream"}`}>
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </Pressable>
      </Pressable>
    </Link>
  );
}
