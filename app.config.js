const appJson = require("./app.json");

// app.json can't read process.env (it's plain JSON), so the react-native-maps
// config plugin — which needs the Google Maps key at prebuild time — lives
// here instead. Everything else stays in app.json.
module.exports = () => {
  const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;

  return {
    ...appJson.expo,
    plugins: [
      ...appJson.expo.plugins,
      "expo-font",
      "expo-splash-screen",
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: googleMapsKey,
          iosGoogleMapsApiKey: googleMapsKey,
        },
      ],
    ],
  };
};
