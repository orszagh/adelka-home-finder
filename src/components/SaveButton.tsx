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
            ? "bg-love-soft text-love-ink ring-1 ring-love/30 hover:bg-love-soft"
            : "bg-accent text-on-accent hover:bg-accent-strong"
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
      className="grid size-9 place-items-center rounded-full bg-surface/90 text-lg shadow ring-1 ring-line transition hover:scale-105"
    >
      <span aria-hidden className={optimisticSaved ? "text-love" : "text-muted"}>
        {optimisticSaved ? "♥" : "♡"}
      </span>
    </button>
  );
}
