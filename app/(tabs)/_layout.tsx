import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  outline,
  filled,
  focused,
}: {
  outline: IconName;
  filled: IconName;
  focused: boolean;
}) {
  return (
    <Ionicons
      name={focused ? filled : outline}
      size={24}
      color={focused ? "#3D2B1F" : "#3D2B1F80"}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#FFF8F0" },
        headerTintColor: "#3D2B1F",
        tabBarActiveTintColor: "#3D2B1F",
        tabBarInactiveTintColor: "#3D2B1F80",
        tabBarStyle: { backgroundColor: "#FFF8F0" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon outline="home-outline" filled="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: "Your List",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon outline="list-outline" filled="list" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon outline="cafe-outline" filled="cafe" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon outline="search-outline" filled="search" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon outline="person-outline" filled="person" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
