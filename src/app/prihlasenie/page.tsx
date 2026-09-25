import type { Metadata } from "next";
import { safeNextPath } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Prihlásenie" };

export default async function LoginPage({ searchParams }: PageProps<"/prihlasenie">) {
  const { next } = await searchParams;
  return (
    <main className="relative isolate flex flex-1 flex-col items-center overflow-hidden px-5 pb-40 pt-14">
      {/* Sea and sun at the bottom, as on a travel poster. */}
      <svg
        aria-hidden
        viewBox="0 0 390 300"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 -z-10 h-72 w-full"
      >
        <circle cx="300" cy="150" r="46" fill="var(--c-sun)" />
        <rect x="0" y="150" width="390" height="150" fill="var(--c-accent-soft)" />
        <path
          d="M0 170 Q20 162 40 170 T80 170 T120 170 T160 170 T200 170 T240 170 T280 170 T320 170 T360 170 T400 170"
          fill="none"
          stroke="var(--c-accent)"
          strokeWidth="2"
          strokeOpacity="0.4"
        />
        <path
          d="M0 200 Q20 192 40 200 T80 200 T120 200 T160 200 T200 200 T240 200 T280 200 T320 200 T360 200 T400 200"
          fill="none"
          stroke="var(--c-accent)"
          strokeWidth="2"
          strokeOpacity="0.25"
        />
      </svg>

      <div className="flex flex-col items-center gap-2 text-center">
        <LogoMark size={96} />
        <h1 className="mt-2 font-display text-4xl font-semibold italic leading-tight text-ink">
          La casetta
          <br />
          di Adelka
        </h1>
        <p className="text-muted">Tvoj domček pri mori už niekde čaká.</p>
      </div>

      <div className="mt-8 w-full max-w-sm space-y-4 rounded-3xl bg-surface p-6 shadow-lift">
        <LoginForm next={safeNextPath(next)} />
        <p className="text-center text-sm text-muted">Zabudla si heslo? Lubko ti ho povie. Za pusu.</p>
      </div>
    </main>
  );
}
