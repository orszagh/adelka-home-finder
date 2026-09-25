"use client";

import { useOptimistic, useTransition } from "react";
import { toggleSaved } from "@/app/actions";
import { ICONS, buttonClass } from "./ui";

function Heart({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <path d={ICONS.heart} />
    </svg>
  );
}

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
        className={
          optimisticSaved ? buttonClass("secondary", "md", "text-love-ink ring-love/40") : buttonClass("primary")
        }
      >
        <Heart filled={optimisticSaved} size={18} />
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
      className={`grid size-11 place-items-center rounded-full bg-surface shadow-card transition-transform hover:scale-105 ${
        optimisticSaved ? "text-love" : "text-muted"
      }`}
    >
      <Heart filled={optimisticSaved} size={22} />
    </button>
  );
}
