import { describe, expect, it } from "vitest";
import { normalizeGeometry, pointInArea, polygonFromLatLngs, toLatLngRings } from "./geo";
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
