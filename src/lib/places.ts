import { HOME_BASE } from "./distance";
import { PriceLevel } from "../data/types";

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;
const PLACES_BASE = "https://places.googleapis.com/v1";
const LONDON_BIAS_RADIUS_METERS = 20000;

export function hasPlacesKey(): boolean {
  return Boolean(API_KEY);
}

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

export async function autocompletePlaces(input: string): Promise<PlaceSuggestion[]> {
  if (!API_KEY || input.trim().length < 3) return [];

  try {
    const res = await fetch(`${PLACES_BASE}/places:autocomplete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
      },
      body: JSON.stringify({
        input,
        regionCode: "GB",
        locationBias: {
          circle: {
            center: { latitude: HOME_BASE.lat, longitude: HOME_BASE.lng },
            radius: LONDON_BIAS_RADIUS_METERS,
          },
        },
      }),
    });

    if (!res.ok) return [];
    const json = await res.json();
    const suggestions = json.suggestions ?? [];

    return suggestions
      .filter((s: { placePrediction?: unknown }) => s.placePrediction)
      .map((s: any) => ({
        placeId: s.placePrediction.placeId,
        mainText: s.placePrediction.structuredFormat?.mainText?.text ?? s.placePrediction.text?.text ?? "",
        secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text ?? "",
      }));
  } catch {
    return [];
  }
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  photoUrl: string | null;
  priceLevel: PriceLevel;
}

const PRICE_LEVEL_MAP: Record<string, PriceLevel> = {
  PRICE_LEVEL_FREE: 1,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 3,
};

function extractNeighborhood(components: { longText: string; types: string[] }[]): string {
  const byType = (type: string) => components.find((c) => c.types.includes(type))?.longText;
  return (
    byType("sublocality_level_1") ??
    byType("sublocality") ??
    byType("neighborhood") ??
    byType("route") ??
    byType("postal_town") ??
    "London"
  );
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!API_KEY) return null;

  try {
    const res = await fetch(`${PLACES_BASE}/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,addressComponents,location,photos,priceLevel",
      },
    });

    if (!res.ok) return null;
    const data = await res.json();

    const photoName = data.photos?.[0]?.name;
    const photoUrl = photoName ? `${PLACES_BASE}/${photoName}/media?maxWidthPx=800&key=${API_KEY}` : null;

    return {
      placeId: data.id ?? placeId,
      name: data.displayName?.text ?? "Unknown cafe",
      address: data.formattedAddress ?? "",
      neighborhood: extractNeighborhood(data.addressComponents ?? []),
      lat: data.location?.latitude ?? HOME_BASE.lat,
      lng: data.location?.longitude ?? HOME_BASE.lng,
      photoUrl,
      priceLevel: PRICE_LEVEL_MAP[data.priceLevel] ?? 2,
    };
  } catch {
    return null;
  }
}
