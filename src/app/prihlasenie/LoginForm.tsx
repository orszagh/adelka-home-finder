"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="username" value="adelka" autoComplete="username" />
      <label className="block text-sm font-medium text-ink-2">
        Heslo
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          className="mt-1 w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-base"
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
        className="w-full rounded-full bg-accent px-4 py-2.5 font-medium text-on-accent hover:bg-accent-strong disabled:opacity-50"
      >
        {pending ? "Prihlasujem…" : "Prihlásiť sa"}
      </button>
    </form>
  );
}
