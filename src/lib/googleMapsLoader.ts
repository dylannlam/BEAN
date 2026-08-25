declare global {
  interface Window {
    google?: typeof google;
    __googleMapsLoaderCallback__?: () => void;
  }
}

let loadPromise: Promise<typeof google> | null = null;

/** Loads the Google Maps JS API script once and resolves with the global `google` object. */
export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in a browser"));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (loadPromise) return loadPromise;

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("EXPO_PUBLIC_GOOGLE_PLACES_KEY is not set"));
  }

  loadPromise = new Promise((resolve, reject) => {
    window.__googleMapsLoaderCallback__ = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("Google Maps failed to initialize"));
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__googleMapsLoaderCallback__&loading=async`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
