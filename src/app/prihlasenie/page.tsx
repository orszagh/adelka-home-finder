import type { Metadata } from "next";
import { safeNextPath } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Prihlásenie · Domček pri mori" };

export default async function LoginPage({ searchParams }: PageProps<"/prihlasenie">) {
  const { next } = await searchParams;
  return (
    <main className="grid flex-1 place-items-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="space-y-1 text-center">
          <p aria-hidden className="text-4xl">🏖️</p>
          <h1 className="text-xl font-semibold">Vitaj, Adelka</h1>
          <p className="text-sm text-slate-600">Zadaj heslo a zostaneš prihlásená na tomto zariadení.</p>
        </div>
        <LoginForm next={safeNextPath(next)} />
      </div>
    </main>
  );
}
