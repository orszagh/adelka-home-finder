/**
 * Illustrated placeholder "photos" for mock listings, so the demo data never
 * shows unrelated stock images.
 */

const WALLS = ["#f4d9a6", "#e9b58f", "#f6e7c8", "#f2c4b0", "#fbf3e4", "#e7c07a", "#f0d2d6"];
const ROOFS = ["#b5532f", "#a8472a", "#c0623c", "#8f3f25"];
const SHUTTERS = ["#3f7d5c", "#2f6f8f", "#5b8f3a", "#6b4f3a"];
const SKIES: [string, string][] = [
  ["#7cc4ef", "#d7efff"],
  ["#f5b98a", "#fde7cf"],
  ["#8fb8e8", "#e6f1ff"],
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(list: T[], n: number): T {
  return list[n % list.length];
}

function house(x: number, y: number, w: number, h: number, n: number): string {
  const wall = pick(WALLS, n);
  const roof = pick(ROOFS, n >>> 3);
  const shutter = pick(SHUTTERS, n >>> 5);
  const floors = 1 + (n % 2);
  const windows: string[] = [];
  const cols = 3;
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + (w / (cols + 1)) * (c + 1) - 14;
      const wy = y + h - (f + 1) * (h / (floors + 0.6)) + 6;
      if (f === 0 && c === 1) continue;
      windows.push(
        `<rect x="${wx - 8}" y="${wy}" width="8" height="34" fill="${shutter}"/>` +
          `<rect x="${wx}" y="${wy}" width="28" height="34" fill="#3b4a5a"/>` +
          `<rect x="${wx + 28}" y="${wy}" width="8" height="34" fill="${shutter}"/>`,
      );
    }
  }
  const doorX = x + w / 2 - 18;
  return `
    <polygon points="${x - 14},${y} ${x + w / 2},${y - h * 0.32} ${x + w + 14},${y}" fill="${roof}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${wall}"/>
    ${windows.join("")}
    <path d="M${doorX} ${y + h} v-44 a18 18 0 0 1 36 0 v44 z" fill="${shutter}"/>`;
}

function scene(seed: string): string {
  const n = hash(seed);
  const [skyTop, skyBottom] = pick(SKIES, n >>> 7);
  const view = n % 3;
  const sea = `<rect y="330" width="960" height="120" fill="#2f86b8"/>
    <path d="M0 360 q40 -8 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" stroke="#9fd3ef" stroke-width="3" fill="none" opacity=".6"/>`;
  const ground = `<rect y="430" width="960" height="210" fill="#c9b27c"/>
    <rect y="430" width="960" height="30" fill="#8fae5a"/>`;
  const cypress = (cx: number) =>
    `<ellipse cx="${cx}" cy="400" rx="16" ry="70" fill="#2f5d3a"/><rect x="${cx - 3}" y="460" width="6" height="16" fill="#5b4330"/>`;
  const sun = `<circle cx="${760 + (n % 120)}" cy="120" r="46" fill="#fff4c2" opacity=".9"/>`;

  const main =
    view === 0
      ? house(300, 250, 360, 210, n)
      : view === 1
        ? house(120, 280, 300, 180, n) + house(560, 300, 260, 160, n >>> 2)
        : house(380, 240, 420, 230, n) + cypress(250) + cypress(300);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640" width="960" height="640">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/>
    </linearGradient></defs>
    <rect width="960" height="640" fill="url(#sky)"/>
    ${sun}
    ${sea}
    ${ground}
    ${main}
    <rect y="600" width="960" height="40" fill="#b89d63"/>
  </svg>`;
}

export async function GET(_request: Request, ctx: RouteContext<"/mock-photo/[seed]">) {
  const { seed } = await ctx.params;
  return new Response(scene(seed.replace(/\.svg$/, "")), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
