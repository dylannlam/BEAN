import { View, Text } from "react-native";
import { RATING_LABEL, RatingValue } from "../data/types";

const STYLES: Record<RatingValue, { bg: string; text: string }> = {
  good: { bg: "bg-green-600", text: "text-white" },
  fine: { bg: "bg-amber-500", text: "text-white" },
  bad: { bg: "bg-red-500", text: "text-white" },
};

export function RatingBadge({ rating }: { rating: RatingValue }) {
  const style = STYLES[rating];
  return (
    <View className={`rounded-full px-2.5 py-1 ${style.bg}`}>
      <Text className={`text-xs font-semibold ${style.text}`}>{RATING_LABEL[rating]}</Text>
    </View>
  );
}
