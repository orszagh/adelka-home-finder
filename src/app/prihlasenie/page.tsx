import type { Metadata } from "next";
import { safeNextPath } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";
import { LoginForm } from "./LoginForm";
import { RivieraScene } from "./RivieraScene";

export const metadata: Metadata = { title: "Prihlásenie" };

export default async function LoginPage({ searchParams }: PageProps<"/prihlasenie">) {
  const { next } = await searchParams;
  return (
    <main className="relative isolate flex min-h-[calc(100dvh-65px)] flex-1 flex-col items-center overflow-hidden px-5 pb-[34vh] pt-[7vh] text-[#fff8ec]">
      <RivieraScene />

      <div className="flex flex-col items-center text-center [text-shadow:0_2px_18px_rgb(80_30_20/0.35)]">
        <span className="grid size-20 place-items-center rounded-full bg-[#fff8ec] shadow-lift">
          <LogoMark size={60} />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.32em]">Liguria · Toscana · Puglia</p>
        <h1 className="mt-2 font-display text-[clamp(3rem,9vw,5.5rem)] font-semibold italic leading-[0.95]">
          La casetta
          <br />
          di Adelka
        </h1>
        <p className="mt-4 font-display text-2xl italic">Benvenuta a casa, amore.</p>
        <p className="mt-1 text-[15px] opacity-90">Tvoj domček pri mori už niekde čaká.</p>
      </div>

      <div className="mt-8 w-full max-w-sm space-y-4 rounded-[28px] bg-white/15 p-6 shadow-lift ring-1 ring-white/35 backdrop-blur-md">
        <LoginForm next={safeNextPath(next)} />
        <p className="text-center text-sm opacity-90">Zabudla si heslo? Lubko ti ho povie. A Sebino ti to dá vytetovať niekam.</p>
      </div>
    </main>
  );
}
