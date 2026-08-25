import { Image, View, Text } from "react-native";
import { User } from "../data/types";
import { colorForId, initialsFor } from "../lib/avatarColors";

/** Renders a user's uploaded photo when they have one, falling back to their
 * initials otherwise — the one place that decision is made. */
export function UserAvatar({ user, size = 40 }: { user: User; size?: number }) {
  if (user.avatarUrl) {
    return <Avatar uri={user.avatarUrl} size={size} />;
  }
  return <InitialsAvatar label={initialsFor(user.displayName)} size={size} color={colorForId(user.id)} />;
}

export function Avatar({ uri, size = 40 }: { uri: string; size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="overflow-hidden bg-latte"
    >
      <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
    </View>
  );
}

export function InitialsAvatar({
  label,
  size = 40,
  color = "#3D2B1F",
}: {
  label: string;
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }}
      className="items-center justify-center"
    >
      <Text className="text-cream font-semibold" style={{ fontSize: size * 0.36 }}>
        {label}
      </Text>
    </View>
  );
}
