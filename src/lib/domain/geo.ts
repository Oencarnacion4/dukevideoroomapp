// Great-circle distance between two lat/lng points, in meters.
const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** 107 Whitford Dr — the Krzyzewski Center for Athletic Excellence (the Video Room's building). */
export const VIDEO_ROOM_LOCATION = { lat: 35.997849, lng: -78.942892 };

/**
 * Generous on purpose: phone GPS drifts 30-100m+ inside a large building
 * like the K Center, and we'd rather let someone genuinely there through
 * than block a legit tap-in. It still rules out tapping in from off campus.
 */
export const VIDEO_ROOM_RADIUS_M = 150;

export function isNearVideoRoom(point: { lat: number; lng: number }, accuracyM = 0): boolean {
  return distanceMeters(point, VIDEO_ROOM_LOCATION) - accuracyM <= VIDEO_ROOM_RADIUS_M;
}
