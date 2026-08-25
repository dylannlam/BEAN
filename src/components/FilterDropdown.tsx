import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

export function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center bg-white rounded-full border border-latte px-3 py-1.5 mr-2"
      >
        <Ionicons name="chevron-down" size={13} color="#3D2B1F" style={{ marginRight: 5 }} />
        <Text className="text-espresso text-sm font-medium">{label}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(61,43,31,0.35)" }}
          onPress={() => setOpen(false)}
        >
          <View
            style={{
              marginTop: 140,
              marginHorizontal: 24,
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              paddingVertical: 6,
              maxHeight: 340,
              shadowColor: "#2A1B10",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            <ScrollView>
              {options.map((opt) => {
                const selected = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className="flex-row items-center justify-between px-4 py-3"
                  >
                    <Text
                      style={{ color: "#3D2B1F", fontWeight: selected ? "700" : "400", fontSize: 15 }}
                    >
                      {opt.label}
                    </Text>
                    {selected && <Ionicons name="checkmark" size={16} color="#E85D3D" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
