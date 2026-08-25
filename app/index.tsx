import { Redirect } from "expo-router";
import { useSessionStore } from "../src/store/session";

export default function Index() {
  const isSignedIn = useSessionStore((s) => s.isSignedIn);
  return <Redirect href={isSignedIn ? "/(tabs)/feed" : "/auth"} />;
}
