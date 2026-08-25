import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { LogoMark, Wordmark } from "../../src/components/Logo";
import { isSupabaseConfigured, supabase } from "../../src/lib/supabase";

type Mode = "signIn" | "signUp";

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <View className="flex-1 bg-cream items-center justify-center p-6">
        <LogoMark size={56} />
        <View className="mt-3 mb-1">
          <Wordmark textSize={26} />
        </View>
        <Text className="text-espresso/60 mb-8 text-center">
          Track, rate, and compete over London's best cafes.
        </Text>
        <Pressable
          onPress={() => router.replace("/(tabs)/feed")}
          className="bg-accent rounded-xl py-3 px-8 items-center"
        >
          <Text className="text-white font-semibold">Continue</Text>
        </Pressable>
      </View>
    );
  }

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter an email and password.");
      return;
    }
    if (mode === "signUp" && !username.trim()) {
      setError("Pick a username.");
      return;
    }

    setLoading(true);
    if (mode === "signIn") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) setError(signInError.message);
      // On success, onAuthStateChange flips the session store and
      // app/_layout redirects into the app automatically.
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim(),
            display_name: displayName.trim() || username.trim(),
          },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else if (!data.session) {
        // Email confirmation is required before a session is issued.
        setCheckEmail(true);
      }
    }
    setLoading(false);
  };

  if (checkEmail) {
    return (
      <View className="flex-1 bg-cream items-center justify-center p-6">
        <LogoMark size={56} />
        <Text className="text-xl font-bold text-espresso mt-3 mb-2">Check your email</Text>
        <Text className="text-espresso/60 text-center">
          We sent a confirmation link to {email.trim()}. Tap it, then come back and sign in.
        </Text>
        <Pressable
          onPress={() => {
            setCheckEmail(false);
            setMode("signIn");
          }}
          className="mt-6"
        >
          <Text className="text-accent font-semibold">Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream justify-center p-6">
      <View className="items-center mb-8">
        <LogoMark size={48} />
        <View className="mt-2">
          <Wordmark textSize={24} />
        </View>
      </View>

      <View className="flex-row bg-white rounded-full border border-latte p-0.5 mb-6">
        {(["signIn", "signUp"] as Mode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => {
              setMode(m);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-full items-center ${mode === m ? "bg-espresso" : ""}`}
          >
            <Text className={mode === m ? "text-cream font-semibold" : "text-espresso"}>
              {m === "signIn" ? "Sign In" : "Sign Up"}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === "signUp" ? (
        <>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            autoCapitalize="none"
            placeholderTextColor="#3D2B1F80"
            className="bg-white rounded-xl px-4 py-3 border border-latte text-espresso mb-3"
          />
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display name (optional)"
            placeholderTextColor="#3D2B1F80"
            className="bg-white rounded-xl px-4 py-3 border border-latte text-espresso mb-3"
          />
        </>
      ) : null}

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#3D2B1F80"
        className="bg-white rounded-xl px-4 py-3 border border-latte text-espresso mb-3"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        placeholderTextColor="#3D2B1F80"
        className="bg-white rounded-xl px-4 py-3 border border-latte text-espresso mb-3"
      />

      {error ? <Text className="text-accent text-sm mb-3">{error}</Text> : null}

      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        className="bg-espresso rounded-xl py-3 items-center mt-2"
      >
        {loading ? (
          <ActivityIndicator color="#FFF8F0" />
        ) : (
          <Text className="text-cream font-semibold">
            {mode === "signIn" ? "Sign In" : "Create Account"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
