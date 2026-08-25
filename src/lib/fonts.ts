import {
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

// The app's editorial type system: Fraunces for headlines/names/scores
// (serif, some real character), Inter for everything else (clean, minimal,
// stays out of the way). Values are the font family names as loaded below —
// use these constants everywhere instead of "Georgia"/Platform.select or
// relying on font-bold (custom static fonts ignore the fontWeight style).
export const FONT_SERIF = "Fraunces_500Medium";
export const FONT_SERIF_ITALIC = "Fraunces_500Medium_Italic";
export const FONT_SERIF_SEMIBOLD = "Fraunces_600SemiBold";
export const FONT_SERIF_BOLD = "Fraunces_700Bold";

export const FONT_SANS = "Inter_400Regular";
export const FONT_SANS_MEDIUM = "Inter_500Medium";
export const FONT_SANS_SEMIBOLD = "Inter_600SemiBold";
export const FONT_SANS_BOLD = "Inter_700Bold";

export const APP_FONTS = {
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
};
