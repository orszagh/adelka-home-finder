"use client";

import { useOptimistic, useTransition } from "react";
import { toggleSaved } from "@/app/actions";

export function SaveButton({
  propertyId,
  saved,
  variant = "icon",
}: {
  propertyId: string;
  saved: boolean;
  variant?: "icon" | "full";
}) {
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);
  const [pending, startTransition] = useTransition();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      setOptimisticSaved(!optimisticSaved);
      await toggleSaved(propertyId);
    });
  };

  const label = optimisticSaved ? "Odobrať z uložených" : "Uložiť";

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={optimisticSaved}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
          optimisticSaved
            ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
            : "bg-sea-700 text-white hover:bg-sea-800"
        }`}
      >
        <span aria-hidden>{optimisticSaved ? "♥" : "♡"}</span>
        {optimisticSaved ? "Uložené" : "Uložiť"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={optimisticSaved}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-full bg-white/90 text-lg shadow ring-1 ring-slate-200 transition hover:scale-105"
    >
      <span aria-hidden className={optimisticSaved ? "text-rose-600" : "text-slate-500"}>
        {optimisticSaved ? "♥" : "♡"}
      </span>
    </button>
  );
}
