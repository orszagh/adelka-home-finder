// Builds src/data/italy-{regions,provinces}.json from ISTAT boundaries
// published by openpolis (CC BY 4.0): https://github.com/openpolis/geojson-italy
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

for (const [name, data] of [["provinces", provinces], ["regions", regions]]) {
  const path = new URL(`../src/data/italy-${name}.json`, import.meta.url);
  writeFileSync(path, JSON.stringify(data));
  console.log(`${name}: ${data.features.length} features, ${Math.round(readFileSync(path).length / 1024)} KB`);
}
