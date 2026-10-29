"use client";

import { useActionState, useEffect } from "react";
import { buttonClass } from "@/components/ui";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });

  // While Adelka types the password, the map (Leaflet and the outlines of Italy) downloads in the
  // background, so after logging in it shows without waiting for it.
  useEffect(() => {
    const preload = () => {
      void import("@/components/HomeFinder");
      void import("@/components/MapView");
    };
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(preload, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(preload, 500);
    return () => clearTimeout(id);
  }, []);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="username" value="adelka" autoComplete="username" />
      <label className="block text-sm font-semibold">
        Heslo
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          className="mt-1.5 min-h-13 w-full rounded-2xl border-2 border-white/60 bg-surface px-4 text-lg text-ink focus:border-accent"
        />
      </label>
      {state.error && (
        <p className="rounded-xl bg-surface px-3 py-2 text-sm text-love-ink" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={buttonClass("danger", "lg", "w-full")}
      >
        {pending ? "Otváram…" : "Vstúpiť"}
      </button>
    </form>
  );
}
