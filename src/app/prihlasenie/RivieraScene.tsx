/**
 * The login backdrop: an evening on the Italian sea. Sunset sky, the sun sinking into the
 * sea, sailing boats drifting on the waves and hearts rising. Colours live in .riviera
 * (globals.css): golden hour in the light theme, dusk in the dark one.
 */

/** Boats from far (small, high on the sea) to near: left %, bottom %, size px, drift s, sail colour. */
const BOATS: [left: number, bottom: number, size: number, drift: number, sail: string][] = [
  [8, 27, 30, 9, "var(--rv-sail)"],
  [30, 30, 22, 11, "var(--rv-sail-2)"],
  [62, 25, 36, 8, "var(--rv-sail-2)"],
  [86, 29, 24, 12, "var(--rv-sail)"],
  [18, 9, 64, 10, "var(--rv-sail)"],
  [70, 6, 80, 9, "var(--rv-sail)"],
];

/** Hearts rising over the sea: left %, bottom %, size px, delay s, duration s. */
const HEARTS: [left: number, bottom: number, size: number, delay: number, duration: number][] = [
  [6, 30, 14, 0, 6],
  [16, 18, 20, 2.4, 7],
  [27, 36, 12, 4.1, 5.5],
  [40, 22, 16, 1.2, 6.5],
  [55, 33, 12, 3.3, 5],
  [66, 16, 22, 0.6, 7.5],
  [78, 34, 14, 2.9, 6],
  [91, 20, 18, 4.8, 6.8],
];

/** A wave line repeating every 40 units, long enough to slide (animate-wave moves it 40 left). */
function waveD(width: number, y: number, amp: number): string {
  let d = `M0 ${y}`;
  for (let x = 0; x < width; x += 40) d += ` Q${x + 10} ${y - amp} ${x + 20} ${y} T${x + 40} ${y}`;
  return `${d} V80 H0 Z`;
}

function Boat({ size, sail }: { size: number; sail: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="origin-[50%_90%] animate-bob">
      <path d="M22 6 V30 M22 8 L34 28 H22 Z" fill={sail} stroke="var(--rv-hull)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M20 10 L10 28 H20 Z" fill="var(--rv-terracotta)" />
      <path d="M6 31 H38 L33 38 H11 Z" fill="var(--rv-hull)" />
    </svg>
  );
}

export function RivieraScene() {
  return (
    <div aria-hidden className="riviera pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Sky and the sun going down behind the horizon. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--rv-sky-1),var(--rv-sky-2)_42%,var(--rv-sky-3)_64%)]" />
      <div className="absolute left-[78%] top-[64%] size-[min(48vmin,380px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--rv-sun-core)_0%,var(--rv-sun)_58%,transparent_72%)] shadow-[0_0_120px_40px_var(--rv-glow)] sm:left-[72%]" />

      {/* The sea, with the sun's path glittering on it. */}
      <div className="absolute inset-x-0 bottom-0 h-[36%] bg-[linear-gradient(to_bottom,var(--rv-sea-1),var(--rv-sea-2))]">
        <div className="absolute left-[78%] top-0 flex w-[min(38vmin,300px)] -translate-x-1/2 flex-col items-center gap-[6%] pt-[3%] sm:left-[72%]">
          {[100, 82, 92, 64, 74, 46, 52, 30].map((width, i) => (
            <span
              key={i}
              className="h-[5px] animate-pulse rounded-full bg-[var(--rv-glitter)]"
              style={{ width: `${width}%`, animationDelay: `${i * 0.35}s`, animationDuration: "2.8s" }}
            />
          ))}
        </div>
        <svg width="1640" height="80" viewBox="0 0 1640 80" className="absolute -top-3 left-0 animate-wave opacity-60">
          <path d={waveD(1640, 14, 6)} fill="var(--rv-sea-1)" />
        </svg>
        <svg width="1640" height="80" viewBox="0 0 1640 80" className="absolute left-0 top-[38%] animate-wave opacity-40 [animation-duration:2.6s]">
          <path d={waveD(1640, 14, 5)} fill="var(--rv-sea-2)" />
        </svg>
      </div>

      {/* Sailing boats drifting slowly back and forth. */}
      {BOATS.map(([left, bottom, size, drift, sail]) => (
        <div
          key={`${left}-${bottom}`}
          className="absolute animate-drift"
          style={{ left: `${left}%`, bottom: `${bottom}%`, animationDuration: `${drift}s` }}
        >
          <Boat size={size} sail={sail} />
        </div>
      ))}

      {/* Hearts rising from the sea. */}
      {HEARTS.map(([left, bottom, size, delay, duration]) => (
        <svg
          key={`${left}-${delay}`}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="var(--rv-heart)"
          className="absolute animate-float-heart"
          style={{ left: `${left}%`, bottom: `${bottom}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
        >
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
        </svg>
      ))}
    </div>
  );
}
