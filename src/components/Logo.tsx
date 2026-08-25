import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FONT_SERIF_BOLD } from "../lib/fonts";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Ionicons name="location" size={size} color="#3D2B1F" />
      <View
        style={{
          position: "absolute",
          top: size * 0.24,
          left: size * 0.44,
          width: size * 0.09,
          height: size * 0.34,
          borderRadius: size * 0.05,
          backgroundColor: "#E85D3D",
          transform: [{ rotate: "18deg" }],
        }}
      />
    </View>
  );
}

export function Wordmark({
  textSize = 20,
  children = "Bean",
}: {
  textSize?: number;
  children?: string;
}) {
  return (
    <Text
      style={{
        fontFamily: FONT_SERIF_BOLD,
        fontSize: textSize,
        color: "#3D2B1F",
      }}
    >
      {children}
    </Text>
  );
}

export function Logo({
  size = 28,
  textSize = 20,
  wordmark = "Bean",
}: {
  size?: number;
  textSize?: number;
  wordmark?: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <LogoMark size={size} />
      <View style={{ marginLeft: 8 }}>
        <Wordmark textSize={textSize}>{wordmark}</Wordmark>
      </View>
    </View>
  );
}
