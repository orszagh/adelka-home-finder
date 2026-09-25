"use client";

import { type CSSProperties, useOptimistic, useState, useTransition } from "react";
import { toggleSaved } from "@/app/actions";
import { useToast } from "./Toast";
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

const BURST_ANGLES = [0, 60, 120, 180, 240, 300];

/** Six little hearts flying out when a house is saved. */
function Burst() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {BURST_ANGLES.map((angle) => (
        <svg
          key={angle}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ "--angle": `${angle}deg` } as CSSProperties}
          className="absolute left-1/2 top-1/2 animate-burst text-love"
        >
          <path d={ICONS.heart} />
        </svg>
      ))}
    </span>
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
  /** Bumped on every save so the pop and the burst play again. */
  const [celebrate, setCelebrate] = useState(0);
  const toast = useToast();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!optimisticSaved) setCelebrate((n) => n + 1);
    toast.show(
      optimisticSaved
        ? { tone: "info", text: "Odložené bokom. Keby si si to rozmyslela, je tu." }
        : { tone: "success", text: "Uložené do srdiečka ♥", action: { href: "/ulozene", label: "Uložené" } },
    );
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
        <span key={celebrate} className={`relative inline-grid ${celebrate > 0 && optimisticSaved ? "animate-pop" : ""}`}>
          <Heart filled={optimisticSaved} size={18} />
          {celebrate > 0 && optimisticSaved && <Burst />}
        </span>
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
      <span key={celebrate} className={`relative inline-grid ${celebrate > 0 && optimisticSaved ? "animate-pop" : ""}`}>
        <Heart filled={optimisticSaved} size={22} />
        {celebrate > 0 && optimisticSaved && <Burst />}
      </span>
    </button>
  );
}
