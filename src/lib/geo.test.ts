import { describe, expect, it } from "vitest";
import { boxAround, circlePolygon, distanceKm, inBox, normalizeGeometry, pointInArea, polygonFromLatLngs, toLatLngRings } from "./geo";
import type { AreaGeometry } from "./types";

const square: AreaGeometry = {
  type: "Polygon",
  coordinates: [
    [
      [10, 43],
      [11, 43],
      [11, 44],
      [10, 44],
      [10, 43],
    ],
  ],
};

describe("pointInArea", () => {
  it("detects points inside and outside a polygon", () => {
    expect(pointInArea(10.5, 43.5, square)).toBe(true);
    expect(pointInArea(12, 43.5, square)).toBe(false);
  });

  it("excludes points inside a hole", () => {
    const withHole: AreaGeometry = {
      type: "Polygon",
      coordinates: [
        square.coordinates[0] as [number, number][],
        [
          [10.4, 43.4],
          [10.6, 43.4],
          [10.6, 43.6],
          [10.4, 43.6],
          [10.4, 43.4],
        ],
      ],
    };
    expect(pointInArea(10.5, 43.5, withHole)).toBe(false);
    expect(pointInArea(10.2, 43.2, withHole)).toBe(true);
  });

  it("handles MultiPolygon", () => {
    const multi: AreaGeometry = {
      type: "MultiPolygon",
      coordinates: [
        (square as { coordinates: [number, number][][] }).coordinates,
        [
          [
            [17, 40],
            [18, 40],
            [18, 41],
            [17, 41],
            [17, 40],
          ],
        ],
      ],
    };
    expect(pointInArea(17.5, 40.5, multi)).toBe(true);
    expect(pointInArea(14, 42, multi)).toBe(false);
  });
});

describe("normalizeGeometry", () => {
  it("unwraps a Feature and rejects invalid input", () => {
    expect(normalizeGeometry({ type: "Feature", geometry: square })).toEqual(square);
    expect(normalizeGeometry({ type: "Point", coordinates: [1, 2] })).toBeNull();
    expect(normalizeGeometry({ type: "Polygon", coordinates: [[[1, 2]]] })).toBeNull();
    expect(normalizeGeometry(null)).toBeNull();
  });
});

describe("polygonFromLatLngs", () => {
  it("closes the ring and swaps to [lng, lat]", () => {
    const geometry = polygonFromLatLngs([
      [43, 10],
      [43, 11],
      [44, 11],
    ]);
    expect(geometry).toEqual({
      type: "Polygon",
      coordinates: [
        [
          [10, 43],
          [11, 43],
          [11, 44],
          [10, 43],
        ],
      ],
    });
    expect(toLatLngRings(geometry)[0][1]).toEqual([43, 11]);
  });
});

describe("boxAround", () => {
  it("holds every point within the distance, in Liguria and in Sicily", () => {
    for (const [lat, lng] of [
      [43.9, 8.08],
      [37.5, 15.09],
    ]) {
      const box = boxAround(lat, lng, 0.6);
      for (let deg = 0; deg < 360; deg += 15) {
        const a = (deg * Math.PI) / 180;
        // About 0.59 km away in direction `deg`.
        const p = { latitude: lat + (0.59 / 111.2) * Math.cos(a), longitude: lng + (0.59 / (111.2 * Math.cos((lat * Math.PI) / 180))) * Math.sin(a) };
        expect(distanceKm([lng, lat], [p.longitude, p.latitude])).toBeLessThan(0.6);
        expect(inBox(p, box)).toBe(true);
      }
      expect(inBox({ latitude: lat + 0.02, longitude: lng }, box)).toBe(false);
    }
  });
});

describe("circlePolygon", () => {
  it("is a closed ring of points `km` from the centre", () => {
    const circle = circlePolygon(9.97, 44.13, 20);
    if (circle.type !== "Polygon") throw new Error("expected a Polygon");
    const [ring] = circle.coordinates;
    expect(ring).toHaveLength(33);
    expect(ring[0]).toEqual(ring.at(-1));
    for (const point of ring) expect(Math.abs(distanceKm([9.97, 44.13], point) - 20)).toBeLessThan(0.2);
  });
});
