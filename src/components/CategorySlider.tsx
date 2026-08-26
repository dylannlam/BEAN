import { useRef, useState } from "react";
import { PanResponder, Text, View } from "react-native";
import { scoreColor } from "../lib/score";

const MIN = 1;
const MAX = 10;

export function CategorySlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const trackWidth = useRef(0);
  const [dragging, setDragging] = useState(false);

  const updateFromX = (x: number) => {
    const width = trackWidth.current;
    if (width <= 0) return;
    const ratio = Math.min(1, Math.max(0, x / width));
    const raw = MIN + ratio * (MAX - MIN);
    const snapped = Math.round(raw * 10) / 10;
    onChange(Math.min(MAX, Math.max(MIN, snapped)));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        setDragging(true);
        updateFromX(e.nativeEvent.locationX);
      },
      onPanResponderMove: (e) => updateFromX(e.nativeEvent.locationX),
      onPanResponderRelease: () => setDragging(false),
      onPanResponderTerminate: () => setDragging(false),
    })
  ).current;

  const pct = ((value - MIN) / (MAX - MIN)) * 100;

  return (
    <View className="mb-5">
      <View className="flex-row justify-between mb-2">
        <Text className="text-[15px] font-medium text-espresso">{label}</Text>
        <Text className="text-[15px] font-semibold" style={{ color: scoreColor(value) }}>
          {value.toFixed(2)}
        </Text>
      </View>
      <View
        className="h-8 justify-center"
        onLayout={(e) => {
          trackWidth.current = e.nativeEvent.layout.width;
        }}
        {...panResponder.panHandlers}
      >
        <View className="h-2 rounded-full bg-latte/40 overflow-hidden">
          <View
            className="h-2 rounded-full"
            style={{ width: `${pct}%`, backgroundColor: scoreColor(value) }}
          />
        </View>
        <View
          className="absolute w-6 h-6 rounded-full bg-white border-2"
          style={{
            left: `${pct}%`,
            marginLeft: -12,
            borderColor: scoreColor(value),
            shadowColor: "#000",
            shadowOpacity: dragging ? 0.25 : 0.15,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
          }}
        />
      </View>
    </View>
  );
}
