import { Image, Text, View } from "react-native";
import { FONT_SERIF_BOLD } from "../lib/fonts";

// The actual app icon file, used as-is (it's already square with
// transparent corners baked in), so the in-app header badge matches the
// home-screen icon exactly.
const LOGO_MARK_ASSET = require("../../assets/icon.png");

/** The app icon badge (assets/icon.png), used inline in headers next to the
 * wordmark. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return <Image source={LOGO_MARK_ASSET} style={{ width: size, height: size }} resizeMode="contain" />;
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
