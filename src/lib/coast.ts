import coastData from "@/data/italy-coast.json";
import { PROVINCES, REGIONS, areaNameFor, provincesOf } from "./italy";
import type { Position } from "./types";

/**
 * Coastline of each coastal province (keyed by its code), built by
 * `npm run geo:build`. Server-side only: keep it out of client components.
 */
const COAST = coastData as unknown as Record<string, Position[][]>;

const KM_PER_DEG_LAT = 110.57;
const kmPerDegLng = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180);

/** Distance from p to segment a–b in km (planar, fine at these distances). */
function segmentDistanceKm([px, py]: Position, [ax, ay]: Position, [bx, by]: Position): number {
  const kx = kmPerDegLng(py);
  const x = (px - ax) * kx;
  const y = (py - ay) * KM_PER_DEG_LAT;
  const dx = (bx - ax) * kx;
  const dy = (by - ay) * KM_PER_DEG_LAT;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, (x * dx + y * dy) / len));
  return Math.hypot(x - t * dx, y - t * dy);
}

function pointDistanceKm(a: Position, b: Position): number {
  return segmentDistanceKm(a, b, b);
}

export function lineLengthKm(line: Position[]): number {
  let sum = 0;
  for (let i = 1; i < line.length; i++) sum += pointDistanceKm(line[i], line[i - 1]);
  return sum;
}

type Chunk = { line: Position[]; minLng: number; maxLng: number; minLat: number; maxLat: number };

/** All coastline split into short pieces with bounding boxes, so most can be skipped. */
const CHUNKS: Chunk[] = Object.values(COAST).flatMap((lines) =>
  lines.flatMap((line) => {
    const pieces: Chunk[] = [];
    for (let i = 0; i < line.length - 1; i += 16) {
      const part = line.slice(i, i + 17);
      const lngs = part.map(([lng]) => lng);
      const lats = part.map(([, lat]) => lat);
      pieces.push({
        line: part,
        minLng: Math.min(...lngs),
        maxLng: Math.max(...lngs),
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
      });
    }
    return pieces;
  }),
);

/** Distance to the nearest Italian coastline, in km (as the crow flies). */
export function distanceToSeaKm(lng: number, lat: number): number {
  const p: Position = [lng, lat];
  const kx = kmPerDegLng(lat);
  let best = Infinity;
  for (const c of CHUNKS) {
    const dx = lng < c.minLng ? (c.minLng - lng) * kx : lng > c.maxLng ? (lng - c.maxLng) * kx : 0;
    const dy = lat < c.minLat ? (c.minLat - lat) * KM_PER_DEG_LAT : lat > c.maxLat ? (lat - c.maxLat) * KM_PER_DEG_LAT : 0;
    if (Math.hypot(dx, dy) >= best) continue;
    for (let i = 1; i < c.line.length; i++) {
      best = Math.min(best, segmentDistanceKm(p, c.line[i - 1], c.line[i]));
    }
  }
  return best;
}

/**
 * Coastline of an area created from a region or a province (matched by
 * name, like the place chooser does). Null for areas that match no place,
 * or places without coast.
 */
export function coastLinesForArea(area: { name: string }): Position[][] | null {
  const region = REGIONS.find((p) => areaNameFor(p) === area.name);
  const codes = region
    ? provincesOf(region.code).map((p) => p.code)
    : PROVINCES.filter((p) => areaNameFor(p) === area.name).map((p) => p.code);
  const lines = codes.flatMap((code) => COAST[code] ?? []);
  return lines.length > 0 ? lines : null;
}

const MIN_CHUNK_KM = 25;
const DROP_BELOW_KM = 3;

/**
 * Splits coastlines into at most `max` pieces of similar length, so each
 * piece can get its own search. When there are more pieces than that
 * (many islands), the longest ones are kept.
 */
export function coastChunks(lines: Position[][], max: number): Position[][] {
  const total = lines.reduce((sum, line) => sum + lineLengthKm(line), 0);
  const target = Math.max(total / max, MIN_CHUNK_KM);
  const pieces: { line: Position[]; km: number }[] = [];
  for (const line of lines) {
    let current: Position[] = [line[0]];
    let km = 0;
    const ownPieces: { line: Position[]; km: number }[] = [];
    for (let i = 1; i < line.length; i++) {
      current.push(line[i]);
      km += pointDistanceKm(line[i - 1], line[i]);
      if (km >= target && i < line.length - 1) {
        ownPieces.push({ line: current, km });
        current = [line[i]];
        km = 0;
      }
    }
    // A short tail joins the previous piece of the same line.
    const last = ownPieces.at(-1);
    if (last && km < target / 2) {
      last.line.push(...current.slice(1));
      last.km += km;
    } else {
      ownPieces.push({ line: current, km });
    }
    pieces.push(...ownPieces);
  }
  return pieces
    .filter((p) => p.km >= DROP_BELOW_KM)
    .sort((a, b) => b.km - a.km)
    .slice(0, max)
    .map((p) => p.line);
}

/** Keeps at most `max` points, always including both ends. */
function samplePoints(line: Position[], max: number): Position[] {
  if (line.length <= max) return line;
  const step = (line.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => line[Math.round(i * step)]);
}

/**
 * Polygon covering everything within `km` of a coast piece (a "sausage"
 * around the line), with at most 40 vertices for Immobiliare's map search.
 * The sea half of it is harmless: no listings there.
 */
export function bandPolygon(line: Position[], km: number): Position[] {
  const points = samplePoints(line, 20);
  const lat0 = points.reduce((sum, [, lat]) => sum + lat, 0) / points.length;
  const kx = kmPerDegLng(lat0);
  const toKm = ([lng, lat]: Position) => [lng * kx, lat * KM_PER_DEG_LAT];
  const toDeg = (x: number, y: number): Position => [
    Math.round((x / kx) * 1e5) / 1e5,
    Math.round((y / KM_PER_DEG_LAT) * 1e5) / 1e5,
  ];
  const xy = points.map(toKm);
  const left: Position[] = [];
  const right: Position[] = [];
  xy.forEach(([x, y], i) => {
    const [px, py] = xy[Math.max(0, i - 1)];
    const [nx, ny] = xy[Math.min(xy.length - 1, i + 1)];
    const len = Math.hypot(nx - px, ny - py) || 1;
    const tx = (nx - px) / len;
    const ty = (ny - py) / len;
    // The ends are pushed outwards along the line, so the band covers them too.
    const along = i === 0 ? -km : i === xy.length - 1 ? km : 0;
    left.push(toDeg(x + tx * along - ty * km, y + ty * along + tx * km));
    right.push(toDeg(x + tx * along + ty * km, y + ty * along - tx * km));
  });
  const ring = [...left, ...right.reverse()];
  ring.push(ring[0]);
  return ring;
}
