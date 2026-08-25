import { Cafe } from "../data/types";

// Fixed "home base" used to compute distances until real device geolocation
// is wired up — Oxford Circus, roughly central London.
export const HOME_BASE = { lat: 51.5152, lng: -0.1419 };

const EARTH_RADIUS_MILES = 3958.8;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function milesBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.sqrt(h));
}

export function milesFromHome(cafe: Cafe): number {
  return milesBetween(HOME_BASE, { lat: cafe.lat, lng: cafe.lng });
}

export function formatMiles(miles: number): string {
  return `${miles.toFixed(1)} mi`;
}

export function isOpenNow(cafe: Cafe, now: Date = new Date()): boolean {
  return now.getHours() < cafe.closeHour;
}

export function formatCloseHour(closeHour: number): string {
  const hour12 = closeHour % 12 === 0 ? 12 : closeHour % 12;
  const suffix = closeHour >= 12 ? "pm" : "am";
  return `${hour12}${suffix}`;
}
