// Builds src/data/italy-{regions,provinces,coast}.json from ISTAT boundaries
// published by openpolis (CC BY 4.0): https://github.com/openpolis/geojson-italy
// Land borders for the coastline: Natural Earth (public domain).
// Run: npm run geo:build
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mapshaper from "mapshaper";

const SOURCE = "https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_provinces.geojson";

/** Regions without any coastline. */
const INLAND_REGIONS = new Set(["Piemonte", "Valle d'Aosta/Vallée d'Aoste", "Lombardia", "Trentino-Alto Adige/Südtirol", "Umbria"]);
/** Provinces without coastline inside otherwise coastal regions. */
const INLAND_PROVINCES = new Set([
  "Firenze", "Pistoia", "Prato", "Arezzo", "Siena",
  "Rieti", "Frosinone",
  "Benevento", "Avellino",
  "Isernia", "L'Aquila",
  "Piacenza", "Parma", "Reggio nell'Emilia", "Modena", "Bologna",
  "Verona", "Vicenza", "Padova", "Treviso", "Belluno",
  "Pordenone",
  "Enna",
]);

/** Inland provinces on the national border, whose outline is partly unshared too. */
const FOREIGN_BORDER = new Set([
  "Cuneo", "Torino", "Valle d'Aosta/Vallée d'Aoste", "Verbano-Cusio-Ossola", "Novara", "Varese", "Como",
  "Sondrio", "Bolzano/Bozen", "Belluno", "Pordenone",
]);

/** Coastal, but with a coastline too short for the vertex check below (Cesenatico, Civitanova Marche, Maratea). */
const SHORT_COAST = new Set(["Forlì-Cesena", "Macerata", "Potenza"]);

const work = mkdtempSync(join(tmpdir(), "italy-geo-"));
const input = join(work, "provinces.geojson");
writeFileSync(input, await (await fetch(SOURCE)).text());

const provincesOut = join(work, "provinces.json");
const regionsOut = join(work, "regions.json");
await mapshaper.runCommands(
  `-i "${input}" -filter-islands min-area=3km2 -simplify 4% keep-shapes ` +
    `-each "code=prov_acr, name=prov_name, region=reg_name, regionCode=reg_istat_code" ` +
    `-filter-fields code,name,region,regionCode ` +
    // Label points inside the shape (pole of inaccessibility), not the bounding-box center.
    `-each "labelLng=Math.round(this.innerX * 1000) / 1000, labelLat=Math.round(this.innerY * 1000) / 1000" ` +
    `-o "${provincesOut}" format=geojson precision=0.001 ` +
    `-dissolve regionCode copy-fields=region ` +
    `-each "labelLng=Math.round(this.innerX * 1000) / 1000, labelLat=Math.round(this.innerY * 1000) / 1000" ` +
    `-o "${regionsOut}" format=geojson precision=0.001`,
);

const provinces = JSON.parse(readFileSync(provincesOut, "utf8"));
for (const f of provinces.features) {
  f.properties.coastal = !INLAND_REGIONS.has(f.properties.region) && !INLAND_PROVINCES.has(f.properties.name);
}

const regions = JSON.parse(readFileSync(regionsOut, "utf8"));
for (const f of regions.features) {
  const { region, regionCode, labelLng, labelLat } = f.properties;
  f.properties = { code: regionCode, name: region, coastal: !INLAND_REGIONS.has(region), labelLng, labelLat };
}

// Sanity check: coastal provinces have plenty of boundary shared with no other province.
const vertexUse = new Map();
const rings = (g) => (g.type === "Polygon" ? g.coordinates : g.coordinates.flat());
for (const f of provinces.features) {
  for (const key of new Set(rings(f.geometry).flat().map((p) => p.join(",")))) {
    vertexUse.set(key, (vertexUse.get(key) ?? 0) + 1);
  }
}
const suspicious = provinces.features.filter((f) => {
  const points = [...new Set(rings(f.geometry).flat().map((p) => p.join(",")))];
  const unshared = points.filter((k) => vertexUse.get(k) === 1).length / points.length;
  // Land borders with France, Switzerland, Austria, Slovenia also count as "unshared".
  return f.properties.coastal ? unshared < 0.02 && !SHORT_COAST.has(f.properties.name) : unshared > 0.02 && !FOREIGN_BORDER.has(f.properties.name);
});
for (const f of suspicious) console.warn(`check coastal flag: ${f.properties.name} (${f.properties.coastal})`);

const coast = await buildCoast(input, new Set(provinces.features.filter((f) => f.properties.coastal).map((f) => f.properties.code)));

for (const [name, data] of [["provinces", provinces], ["regions", regions], ["coast", coast]]) {
  const path = new URL(`../src/data/italy-${name}.json`, import.meta.url);
  writeFileSync(path, JSON.stringify(data));
  const count = data.features ? data.features.length : Object.keys(data).length;
  console.log(`${name}: ${count} features, ${Math.round(readFileSync(path).length / 1024)} KB`);
}

/**
 * Coastline of every coastal province: the parts of its outline shared with
 * no other province, minus land borders with neighbouring countries
 * (Natural Earth, public domain). Finer than the map shapes, because
 * "3 km from the sea" needs a coastline accurate to a few hundred metres.
 */
async function buildCoast(source, coastalCodes) {
  const out = join(work, "coast-source.json");
  await mapshaper.runCommands(
    `-i "${source}" -filter-islands min-area=3km2 -simplify interval=250 keep-shapes ` +
      `-each "code=prov_acr" -filter-fields code -o "${out}" format=geojson precision=0.001`,
  );
  const features = JSON.parse(readFileSync(out, "utf8")).features;
  const outerRingsOf = (g) => (g.type === "Polygon" ? [g.coordinates[0]] : g.coordinates.map((p) => p[0]));
  const edgeKey = (a, b) => {
    const ka = a.join(",");
    const kb = b.join(",");
    return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
  };

  // Holes count too: an enclave's outline is shared with the hole around it.
  const allRingsOf = (g) => (g.type === "Polygon" ? g.coordinates : g.coordinates.flat());
  const edgeUse = new Map();
  for (const f of features) {
    for (const ring of allRingsOf(f.geometry)) {
      for (let i = 1; i < ring.length; i++) {
        const key = edgeKey(ring[i - 1], ring[i]);
        edgeUse.set(key, (edgeUse.get(key) ?? 0) + 1);
      }
    }
  }

  // Natural Earth borders are off by up to ~3 km; the first few km of coast next to a border are lost.
  const BORDER_KM = 3.2;
  const borders = await landBorderSegments();
  const nearBorder = ([ax, ay], [bx, by]) => {
    const mid = [(ax + bx) / 2, (ay + by) / 2];
    return borders.some((seg) => segmentDistanceKm(mid, seg[0], seg[1]) < BORDER_KM);
  };

  const result = {};
  for (const f of features) {
    const code = f.properties.code;
    if (!coastalCodes.has(code)) continue;
    const lines = [];
    for (const ring of outerRingsOf(f.geometry)) {
      const isCoast = [];
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1];
        const b = ring[i];
        isCoast.push(edgeUse.get(edgeKey(a, b)) === 1 && !nearBorder(a, b));
      }
      // Rotate so the walk starts on a non-coastal edge and runs do not wrap around.
      const start = isCoast.indexOf(false);
      if (start === -1) {
        lines.push(ring);
        continue;
      }
      let run = null;
      for (let k = 0; k < isCoast.length; k++) {
        const i = (start + k) % isCoast.length;
        if (isCoast[i]) {
          run ??= [ring[i]];
          run.push(ring[i + 1]);
        } else if (run) {
          lines.push(run);
          run = null;
        }
      }
      if (run) lines.push(run);
    }
    const kept = lines.filter((line) => lineLengthKm(line) >= 2);
    if (kept.length === 0) console.warn(`coast: no coastline found for ${code}`);
    else result[code] = kept;
  }
  return result;
}

async function landBorderSegments() {
  const url =
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_boundary_lines_land.geojson";
  const data = await (await fetch(url)).json();
  const inItaly = ([lng, lat]) => lng > 5.5 && lng < 19 && lat > 35 && lat < 47.5;
  const segments = [];
  for (const f of data.features) {
    const g = f.geometry;
    const lines = g.type === "LineString" ? [g.coordinates] : g.coordinates;
    for (const line of lines) {
      for (let i = 1; i < line.length; i++) {
        if (inItaly(line[i - 1]) || inItaly(line[i])) segments.push([line[i - 1], line[i]]);
      }
    }
  }
  return segments;
}

function segmentDistanceKm([px, py], [ax, ay], [bx, by]) {
  const kx = 111.32 * Math.cos((py * Math.PI) / 180);
  const ky = 110.57;
  const x = (px - ax) * kx;
  const y = (py - ay) * ky;
  const dx = (bx - ax) * kx;
  const dy = (by - ay) * ky;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, (x * dx + y * dy) / len));
  return Math.hypot(x - t * dx, y - t * dy);
}

function lineLengthKm(line) {
  let sum = 0;
  for (let i = 1; i < line.length; i++) sum += segmentDistanceKm(line[i], line[i - 1], line[i - 1]);
  return sum;
}
