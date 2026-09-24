"use client";

import { useState, useTransition } from "react";
import { checkNow } from "@/app/actions";

export function CheckNowButton({ waitMinutes }: { waitMinutes: number }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const run = () =>
    startTransition(async () => {
      setMessage(null);
      const result = await checkNow();
      setMessage(result.ok ? "Hotovo, ponuky sú aktuálne." : result.error);
    });

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={run}
        disabled={pending || waitMinutes > 0}
        title="Stiahne čerstvé ponuky pre všetky tvoje oblasti (najviac raz za hodinu)"
        className="rounded-full px-3 py-1.5 text-sm font-medium text-accent-ink ring-1 ring-accent hover:bg-accent-soft disabled:opacity-50"
      >
        {pending ? "Pozerám na portáloch…" : "🔄 Pozrieť teraz"}
      </button>
      <span className="text-xs text-muted" role="status">
        {pending
          ? "Môže to trvať do minúty."
          : (message ?? (waitMinutes > 0 ? `Znova to pôjde o ${waitMinutes} min.` : null))}
      </span>
    </div>
  );
}
