import { describe, expect, it } from "vitest";
import { distanceMeters, isNearVideoRoom, VIDEO_ROOM_LOCATION } from "./geo";

describe("distanceMeters", () => {
  it("is zero for the same point", () => {
    expect(distanceMeters(VIDEO_ROOM_LOCATION, VIDEO_ROOM_LOCATION)).toBeCloseTo(0, 1);
  });

  it("returns a sane distance for a point a few miles away", () => {
    // Roughly downtown Durham, a few km from the K Center.
    const downtownDurham = { lat: 35.9940, lng: -78.8986 };
    const d = distanceMeters(VIDEO_ROOM_LOCATION, downtownDurham);
    expect(d).toBeGreaterThan(3000);
    expect(d).toBeLessThan(6000);
  });
});

describe("isNearVideoRoom", () => {
  it("accepts the exact point", () => {
    expect(isNearVideoRoom(VIDEO_ROOM_LOCATION)).toBe(true);
  });

  it("accepts a small offset within the radius", () => {
    expect(isNearVideoRoom({ lat: VIDEO_ROOM_LOCATION.lat + 0.0005, lng: VIDEO_ROOM_LOCATION.lng })).toBe(true);
  });

  it("rejects a point miles away", () => {
    expect(isNearVideoRoom({ lat: 36.05, lng: -78.9 })).toBe(false);
  });

  it("lets a wide GPS accuracy radius bridge a slightly-out-of-range point", () => {
    const justOutside = { lat: VIDEO_ROOM_LOCATION.lat + 0.0016, lng: VIDEO_ROOM_LOCATION.lng };
    expect(isNearVideoRoom(justOutside)).toBe(false);
    expect(isNearVideoRoom(justOutside, 100)).toBe(true);
  });
});
