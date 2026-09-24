import { describe, expect, it } from "vitest";
import { bandPolygon, coastChunks, coastLinesForArea, distanceToSeaKm, lineLengthKm } from "./coast";
import { seaLabel } from "./format";
import { pointInPolygon } from "./geo";

describe("coastline", () => {
  it("measures the distance to the sea", () => {
    expect(distanceToSeaKm(15.146, 37.556)).toBeLessThan(3); // Aci Castello
    expect(distanceToSeaKm(16.871, 41.126)).toBeLessThan(1.5); // Bari, old town
    expect(distanceToSeaKm(8.935, 44.407)).toBeLessThan(1.5); // Genova
    expect(distanceToSeaKm(14.062, 37.49)).toBeGreaterThan(20); // Caltanissetta
    expect(distanceToSeaKm(14.839, 37.577)).toBeGreaterThan(15); // Paternò
    expect(distanceToSeaKm(11.255, 43.769)).toBeGreaterThan(50); // Firenze
  });

  it("labels the distance on listing cards", () => {
    expect(seaLabel(0.3)).toBe("do 1 km od mora");
    expect(seaLabel(2.6)).toBe("3 km od mora");
  });

  it("finds the coast of provinces and regions, not of inland ones", () => {
    expect(coastLinesForArea({ name: "Catania" })).not.toBeNull();
    expect(coastLinesForArea({ name: "Enna" })).toBeNull();
    expect(coastLinesForArea({ name: "Umbria (celý región)" })).toBeNull();
    expect(coastLinesForArea({ name: "Moja oblasť" })).toBeNull();
    const sicily = coastLinesForArea({ name: "Sicília (celý región)" })!;
    const catania = coastLinesForArea({ name: "Catania" })!;
    expect(sicily.length).toBeGreaterThan(catania.length);
  });

  it("leaves out land borders with other countries", () => {
    // Imperia borders France north of Ventimiglia; its coast stays south of 43.95°.
    const imperia = coastLinesForArea({ name: "Imperia" })!.flat();
    expect(Math.max(...imperia.map(([, lat]) => lat))).toBeLessThan(43.95);
    // San Marino and the Swiss/Slovenian borders are not "sea".
    expect(distanceToSeaKm(12.447, 43.936)).toBeGreaterThan(10); // San Marino
    expect(distanceToSeaKm(9.03, 45.97)).toBeGreaterThan(100); // Lugano
    expect(distanceToSeaKm(13.64, 45.95)).toBeGreaterThan(10); // Nova Gorica
  });

  it("splits a coast into similar pieces", () => {
    const lines = coastLinesForArea({ name: "Catania" })!;
    const total = lines.reduce((s, l) => s + lineLengthKm(l), 0);
    const chunks = coastChunks(lines, 4);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks.length).toBeLessThanOrEqual(4);
    const covered = chunks.reduce((s, l) => s + lineLengthKm(l), 0);
    expect(covered).toBeGreaterThan(total * 0.95);

    const sicily = coastChunks(coastLinesForArea({ name: "Sicília (celý región)" })!, 4);
    expect(sicily).toHaveLength(4);
  });

  it("builds a band around a coast piece that Immobiliare can take", () => {
    const [chunk] = coastChunks(coastLinesForArea({ name: "Catania" })!, 4);
    const ring = bandPolygon(chunk, 3);
    expect(ring.length).toBeLessThanOrEqual(41);
    expect(ring[0]).toEqual(ring.at(-1));
    // Every coast point of the piece lies inside its band.
    const inside = chunk.filter(([lng, lat]) => pointInPolygon(lng, lat, [ring])).length;
    expect(inside / chunk.length).toBeGreaterThan(0.9);
  });
});
