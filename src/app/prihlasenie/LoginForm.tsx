"use client";

import { useActionState } from "react";
import { buttonClass } from "@/components/ui";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="username" value="adelka" autoComplete="username" />
      <label className="block text-sm font-semibold text-ink">
        Heslo
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          className="mt-1.5 min-h-13 w-full rounded-2xl border-2 border-accent bg-surface px-4 text-lg text-ink"
        />
      </label>
      {state.error && (
        <p className="text-sm text-love-ink" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={buttonClass("primary", "lg", "w-full")}
      >
        {pending ? "Otváram…" : "Vstúpiť"}
      </button>
    </form>
  );
}
