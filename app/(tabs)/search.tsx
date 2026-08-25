import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { cafeRepository, userRepository, visitRepository } from "../../src/data/repositories";
import { useAsync } from "../../src/lib/useAsync";
import { useFiltersStore } from "../../src/store/filters";
import { useSessionStore } from "../../src/store/session";
import { SearchResultRow } from "../../src/components/SearchResultRow";
import { PersonRow } from "../../src/components/PersonRow";
import { ScoreBubble, BubbleTier, scoreBubbleSvgIcon } from "../../src/components/ScoreBubble";
import { MoreFiltersModal } from "../../src/components/MoreFiltersModal";
import { CafeDetailSheet } from "../../src/components/CafeDetailSheet";
import {
  getCrowdScore,
  getUserRankForCafe,
  getUserScoreForCafe,
} from "../../src/lib/cafeStats";
import { isOpenNow, milesBetween, milesFromHome } from "../../src/lib/distance";
import { loadGoogleMaps } from "../../src/lib/googleMapsLoader";
import { autocompletePlaces, getPlaceDetails, PlaceSuggestion } from "../../src/lib/places";
import { Cafe, User, Visit } from "../../src/data/types";

const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800";

function placeToCafe(details: NonNullable<Awaited<ReturnType<typeof getPlaceDetails>>>): Cafe {
  return {
    id: `place-${details.placeId}`,
    name: details.name,
    address: details.address,
    neighborhood: details.neighborhood,
    lat: details.lat,
    lng: details.lng,
    priceLevel: details.priceLevel,
    photoUrl: details.photoUrl ?? FALLBACK_PHOTO,
    tagIds: [],
    closeHour: 19,
  };
}

const LONDON_REGION = {
  latitude: 51.5074,
  longitude: -0.1278,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const NEAR_ME_RADIUS_MILES = 1.2;

type ViewMode = "list" | "map";

function QuickChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 mr-2 ${
        active ? "bg-espresso border-espresso" : "bg-white border-latte"
      }`}
    >
      <Text className={`text-sm ${active ? "text-cream font-semibold" : "text-espresso"}`}>{label}</Text>
    </Pressable>
  );
}

export default function SearchScreen() {
  const currentUserId = useSessionStore((s) => s.currentUserId);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [addingPlaceId, setAddingPlaceId] = useState<string | null>(null);
  const [pendingFollowId, setPendingFollowId] = useState<string | null>(null);
  const latestQueryRef = useRef("");

  const {
    query,
    setQuery,
    selectedTagIds,
    toggleTag,
    maxPrice,
    setMaxPrice,
    nearMe,
    toggleNearMe,
    openNow,
    toggleOpenNow,
    reset,
  } = useFiltersStore();

  const { data, loading, reload } = useAsync(async () => {
    const [cafes, visits, users, following] = await Promise.all([
      cafeRepository.listCafes(),
      visitRepository.listVisits(),
      userRepository.listUsers(),
      userRepository.listFollowing(currentUserId),
    ]);
    return { cafes, visits, users, following };
  }, [currentUserId]);

  const results = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const filtered = data.cafes.filter((cafe) => {
      if (q && !`${cafe.name} ${cafe.neighborhood}`.toLowerCase().includes(q)) return false;
      if (maxPrice && cafe.priceLevel > maxPrice) return false;
      if (selectedTagIds.length > 0 && !selectedTagIds.every((t) => cafe.tagIds.includes(t))) {
        return false;
      }
      if (openNow && !isOpenNow(cafe)) return false;
      if (nearMe && milesFromHome(cafe) > NEAR_ME_RADIUS_MILES) return false;
      return true;
    });
    return [...filtered].sort((a, b) => milesFromHome(a) - milesFromHome(b));
  }, [data, query, selectedTagIds, maxPrice, openNow, nearMe]);

  const matchingUsers = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return data.users.filter(
      (u) =>
        u.id !== currentUserId &&
        (u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
    );
  }, [data, query, currentUserId]);

  const handleToggleFollow = async (targetUserId: string, isFollowing: boolean) => {
    setPendingFollowId(targetUserId);
    if (isFollowing) {
      await userRepository.unfollow(currentUserId, targetUserId);
    } else {
      await userRepository.follow(currentUserId, targetUserId);
    }
    await reload();
    setPendingFollowId(null);
  };

  const followingIds = useMemo(
    () => new Set((data?.following ?? []).map((f) => f.followingId)),
    [data]
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setPlaceSuggestions([]);
      setPlacesLoading(false);
      return;
    }

    setPlacesLoading(true);
    const timeout = setTimeout(async () => {
      latestQueryRef.current = trimmed;
      const suggestions = await autocompletePlaces(trimmed);
      if (latestQueryRef.current === trimmed) {
        setPlaceSuggestions(suggestions);
        setPlacesLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  const knownPlaceIds = useMemo(
    () => new Set((data?.cafes ?? []).map((c) => c.id)),
    [data]
  );

  async function handleAddPlace(suggestion: PlaceSuggestion) {
    setAddingPlaceId(suggestion.placeId);
    const details = await getPlaceDetails(suggestion.placeId);
    if (details) {
      const saved = await cafeRepository.addCafe(placeToCafe(details));
      await reload();
      router.push({ pathname: "/cafe/[id]", params: { id: saved.id } });
    }
    setAddingPlaceId(null);
  }

  if (loading || !data) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const cheapActive = maxPrice === 1;
  const studyActive = selectedTagIds.includes("study");

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-cream">
      <View className="px-3 pt-3">
        <View className="flex-row items-center bg-white rounded-full border border-latte px-3">
          <Ionicons name="location-outline" size={16} color="#3D2B1F80" style={{ marginRight: 6 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search shops, people, vibes"
            placeholderTextColor="#3D2B1F80"
            className="flex-1 text-espresso py-3"
          />
        </View>
      </View>

      <View className="flex-row bg-white rounded-full border border-latte p-0.5 mx-3 mt-3">
        {(["list", "map"] as ViewMode[]).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setViewMode(mode)}
            className={`flex-1 py-2 rounded-full items-center ${
              viewMode === mode ? "bg-espresso" : ""
            }`}
          >
            <Text className={viewMode === mode ? "text-cream font-semibold text-sm" : "text-espresso text-sm"}>
              {mode === "list" ? "List" : "Map"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-3 pt-3"
        contentContainerStyle={{ flexDirection: "row", alignItems: "center" }}
        style={{ flexGrow: 0, flexShrink: 0, height: 48 }}
      >
        <QuickChip label="Near me" active={nearMe} onPress={toggleNearMe} />
        <QuickChip label="Study" active={studyActive} onPress={() => toggleTag("study")} />
        <QuickChip label="Open now" active={openNow} onPress={toggleOpenNow} />
        <QuickChip label="$" active={cheapActive} onPress={() => setMaxPrice(cheapActive ? null : 1)} />
        <Pressable
          onPress={() => setMoreFiltersOpen(true)}
          className="flex-row items-center rounded-full border border-latte bg-white px-3 py-1.5 mr-2"
        >
          <Ionicons name="options-outline" size={14} color="#3D2B1F" style={{ marginRight: 4 }} />
          <Text className="text-espresso text-sm">More</Text>
        </Pressable>
      </ScrollView>

      {viewMode === "list" ? (
        <>
          <Text className="text-xs font-semibold text-espresso/45 uppercase px-4 pt-3 pb-1">
            {nearMe ? "Near You" : "All Areas"} · {results.length} shop{results.length === 1 ? "" : "s"}
          </Text>
          <FlatList
            contentContainerStyle={{ padding: 12, paddingTop: 4 }}
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const yourRank = getUserRankForCafe(currentUserId, item.id, data.visits);
              const yourScore = getUserScoreForCafe(currentUserId, item.id, data.visits);
              const crowdScore = getCrowdScore(item.id, data.visits);
              return (
                <SearchResultRow
                  cafe={item}
                  distanceMiles={milesFromHome(item)}
                  yourRank={yourRank}
                  yourScore={yourScore}
                  crowdScore={crowdScore}
                  visited={yourRank !== null}
                  onQuickAdd={async () => {
                    await visitRepository.addVisit({
                      userId: currentUserId,
                      cafeId: item.id,
                      rating: "good",
                      score: 0,
                      note: "",
                      tagIds: [],
                      status: "want",
                      photoUrls: [],
                    });
                    reload();
                  }}
                />
              );
            }}
            ListHeaderComponent={
              matchingUsers.length > 0 ? (
                <View className="mb-3">
                  <Text className="text-xs font-semibold text-espresso/45 uppercase mb-2">People</Text>
                  {matchingUsers.map((u) => (
                    <PersonRow
                      key={u.id}
                      user={u}
                      isFollowing={followingIds.has(u.id)}
                      pending={pendingFollowId === u.id}
                      onToggleFollow={() => handleToggleFollow(u.id, followingIds.has(u.id))}
                    />
                  ))}
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text className="text-espresso/60">No cafes match those filters.</Text>
              </View>
            }
            ListFooterComponent={
              query.trim().length >= 3 ? (
                <View className="mt-2">
                  <Text className="text-xs font-semibold text-espresso/45 uppercase pb-2">
                    From Google Maps
                  </Text>
                  {placesLoading && (
                    <ActivityIndicator style={{ marginBottom: 12 }} />
                  )}
                  {!placesLoading &&
                    placeSuggestions
                      .filter((s) => !knownPlaceIds.has(`place-${s.placeId}`))
                      .map((s) => (
                        <Pressable
                          key={s.placeId}
                          onPress={() => handleAddPlace(s)}
                          disabled={addingPlaceId !== null}
                          className="flex-row items-center bg-white rounded-2xl mb-3 p-3 border border-latte/30"
                        >
                          <View className="w-9 h-9 rounded-full bg-latte/30 items-center justify-center mr-3">
                            <Ionicons name="logo-google" size={15} color="#3D2B1F" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-[15px] font-semibold text-espresso" numberOfLines={1}>
                              {s.mainText}
                            </Text>
                            <Text className="text-xs text-espresso/50" numberOfLines={1}>
                              {s.secondaryText}
                            </Text>
                          </View>
                          {addingPlaceId === s.placeId ? (
                            <ActivityIndicator size="small" />
                          ) : (
                            <Ionicons name="add-circle-outline" size={22} color="#3D2B1F" />
                          )}
                        </Pressable>
                      ))}
                  {!placesLoading && placeSuggestions.length === 0 && (
                    <Text className="text-espresso/40 text-xs pb-4">
                      No Google Maps results for "{query.trim()}".
                    </Text>
                  )}
                </View>
              ) : null
            }
          />
        </>
      ) : (
        <View className="flex-1 mt-2">
          <MapResults
            cafes={results}
            currentUserId={currentUserId}
            followingIds={followingIds}
            visits={data.visits}
            users={data.users}
            selectedCafe={selectedCafe}
            onSelectCafe={setSelectedCafe}
            onChanged={reload}
          />
        </View>
      )}

      <MoreFiltersModal
        visible={moreFiltersOpen}
        onClose={() => setMoreFiltersOpen(false)}
        selectedTagIds={selectedTagIds}
        toggleTag={toggleTag}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        onClear={reset}
      />
    </SafeAreaView>
  );
}

const SEARCH_AREA_RADIUS_MILES = 1.0;

interface LatLng {
  lat: number;
  lng: number;
}

function MapResults({
  cafes,
  currentUserId,
  followingIds,
  visits,
  users,
  selectedCafe,
  onSelectCafe,
  onChanged,
}: {
  cafes: Cafe[];
  currentUserId: string;
  followingIds: Set<string>;
  visits: Visit[];
  users: User[];
  selectedCafe: Cafe | null;
  onSelectCafe: (cafe: Cafe | null) => void;
  onChanged: () => void;
}) {
  const [pendingCenter, setPendingCenter] = useState<LatLng | null>(null);
  const [searchCenter, setSearchCenter] = useState<LatLng | null>(null);
  const [hasPanned, setHasPanned] = useState(false);

  function tierFor(cafeId: string): BubbleTier {
    const beenVisits = visits.filter((v) => v.cafeId === cafeId && v.status === "been");
    if (beenVisits.some((v) => v.userId === currentUserId)) return "mine";
    if (beenVisits.some((v) => followingIds.has(v.userId))) return "friends";
    return "other";
  }

  function scoreFor(cafeId: string, tier: BubbleTier): number | null {
    if (tier === "mine") return getUserScoreForCafe(currentUserId, cafeId, visits);
    if (tier === "friends") {
      const friendVisits = visits.filter(
        (v) => v.cafeId === cafeId && v.status === "been" && followingIds.has(v.userId)
      );
      if (friendVisits.length === 0) return null;
      return friendVisits.reduce((sum, v) => sum + v.score, 0) / friendVisits.length;
    }
    return null;
  }

  const visibleCafes = useMemo(() => {
    if (!searchCenter) return cafes;
    return [...cafes]
      .filter((c) => milesBetween({ lat: c.lat, lng: c.lng }, searchCenter) <= SEARCH_AREA_RADIUS_MILES)
      .sort(
        (a, b) =>
          milesBetween({ lat: a.lat, lng: a.lng }, searchCenter) -
          milesBetween({ lat: b.lat, lng: b.lng }, searchCenter)
      );
  }, [cafes, searchCenter]);

  return (
    <View className="flex-1">
      <View className="flex-1">
        <MapBody
          cafes={visibleCafes}
          tierFor={tierFor}
          scoreFor={scoreFor}
          selectedCafeId={selectedCafe?.id ?? null}
          onSelectCafe={onSelectCafe}
          onRegionChange={(center) => {
            setPendingCenter(center);
            setHasPanned(true);
          }}
        />
      </View>

      {hasPanned && (
        <View className="absolute top-2 left-0 right-0 items-center">
          <Pressable
            onPress={() => {
              if (pendingCenter) setSearchCenter(pendingCenter);
              setHasPanned(false);
            }}
            className="flex-row items-center bg-white rounded-full border border-latte px-3 py-1.5"
            style={{
              shadowColor: "#2A1B10",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Ionicons name="refresh" size={12} color="#3D2B1F" style={{ marginRight: 5 }} />
            <Text className="text-espresso text-xs font-medium">Search this area</Text>
          </Pressable>
        </View>
      )}

      {searchCenter && !hasPanned && (
        <View className="absolute top-2 left-0 right-0 items-center">
          <Pressable
            onPress={() => setSearchCenter(null)}
            className="flex-row items-center bg-espresso rounded-full px-3 py-1.5"
          >
            <Ionicons name="close-circle" size={13} color="#FFF8F0" style={{ marginRight: 5 }} />
            <Text className="text-cream text-xs font-medium">Showing this area only</Text>
          </Pressable>
        </View>
      )}

      <CafeDetailSheet
        cafe={selectedCafe}
        visits={visits}
        users={users}
        currentUserId={currentUserId}
        onClose={() => onSelectCafe(null)}
        onChanged={onChanged}
      />
    </View>
  );
}

function MapBody({
  cafes,
  tierFor,
  scoreFor,
  selectedCafeId,
  onSelectCafe,
  onRegionChange,
}: {
  cafes: Cafe[];
  tierFor: (cafeId: string) => BubbleTier;
  scoreFor: (cafeId: string, tier: BubbleTier) => number | null;
  selectedCafeId: string | null;
  onSelectCafe: (cafe: Cafe) => void;
  onRegionChange: (center: LatLng) => void;
}) {
  if (Platform.OS === "web") {
    return (
      <GoogleMapsWeb
        cafes={cafes}
        tierFor={tierFor}
        scoreFor={scoreFor}
        selectedCafeId={selectedCafeId}
        onSelectCafe={onSelectCafe}
        onRegionChange={onRegionChange}
      />
    );
  }

  const MapView = require("react-native-maps").default;
  const { Marker, PROVIDER_GOOGLE } = require("react-native-maps");

  return (
    <MapView
      style={{ flex: 1 }}
      provider={PROVIDER_GOOGLE}
      initialRegion={LONDON_REGION}
      onRegionChangeComplete={(region: { latitude: number; longitude: number }) =>
        onRegionChange({ lat: region.latitude, lng: region.longitude })
      }
    >
      {cafes.map((cafe) => {
        const tier = tierFor(cafe.id);
        const selected = cafe.id === selectedCafeId;
        return (
          <Marker
            key={cafe.id}
            coordinate={{ latitude: cafe.lat, longitude: cafe.lng }}
            onPress={() => onSelectCafe(cafe)}
            zIndex={selected ? 1 : 0}
          >
            <ScoreBubble tier={tier} score={scoreFor(cafe.id, tier)} selected={selected} />
          </Marker>
        );
      })}
    </MapView>
  );
}

function GoogleMapsWeb({
  cafes,
  tierFor,
  scoreFor,
  selectedCafeId,
  onSelectCafe,
  onRegionChange,
}: {
  cafes: Cafe[];
  tierFor: (cafeId: string) => BubbleTier;
  scoreFor: (cafeId: string, tier: BubbleTier) => number | null;
  selectedCafeId: string | null;
  onSelectCafe: (cafe: Cafe) => void;
  onRegionChange: (center: LatLng) => void;
}) {
  const containerRef = useRef<View>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const onRegionChangeRef = useRef(onRegionChange);
  onRegionChangeRef.current = onRegionChange;
  const onSelectCafeRef = useRef(onSelectCafe);
  onSelectCafeRef.current = onSelectCafe;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !containerRef.current) return;
        const map = new g.maps.Map(containerRef.current as unknown as HTMLElement, {
          center: { lat: LONDON_REGION.latitude, lng: LONDON_REGION.longitude },
          zoom: 13,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        map.addListener("idle", () => {
          const center = map.getCenter();
          if (center) onRegionChangeRef.current({ lat: center.lat(), lng: center.lng() });
        });
        mapRef.current = map;
        setMapReady(true);
      })
      .catch(() => setLoadError(true));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.google) return;
    const g = window.google;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = cafes.map((cafe) => {
      const tier = tierFor(cafe.id);
      const selected = cafe.id === selectedCafeId;
      const { url, size } = scoreBubbleSvgIcon(tier, scoreFor(cafe.id, tier), selected);
      const marker = new g.maps.Marker({
        position: { lat: cafe.lat, lng: cafe.lng },
        map: mapRef.current!,
        icon: {
          url,
          scaledSize: new g.maps.Size(size, size),
          anchor: new g.maps.Point(size / 2, size / 2),
        },
        zIndex: selected ? 1000 : undefined,
      });
      marker.addListener("click", () => onSelectCafeRef.current(cafe));
      return marker;
    });
  }, [mapReady, cafes, selectedCafeId, tierFor, scoreFor]);

  if (loadError) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-espresso/60 text-center">
          Couldn't load Google Maps. Check that EXPO_PUBLIC_GOOGLE_PLACES_KEY is set and Maps JavaScript API is enabled.
        </Text>
      </View>
    );
  }

  return <View ref={containerRef} style={{ flex: 1 }} />;
}
