"use client";

import { markNewsSeen } from "@/app/actions";
import type { Greeting } from "@/lib/greeting";

export function GreetingCard({
  greeting,
  onShow,
  onDismiss,
  className = "",
}: {
  greeting: Greeting;
  onShow: () => void;
  onDismiss: () => void;
  className?: string;
}) {
  return (
    <section
      aria-live="polite"
      className={`relative rounded-2xl bg-gradient-to-br from-amber-50 to-sea-50 p-4 shadow-sm ring-1 ring-amber-200 ${className}`}
    >
      <button
        type="button"
        onClick={() => {
          onDismiss();
          void markNewsSeen();
        }}
        aria-label="Zavrieť privítanie"
        className="absolute right-2 top-2 grid size-8 place-items-center rounded-full text-slate-500 hover:bg-white/70"
      >
        ×
      </button>
      <h2 className="pr-8 text-lg font-semibold text-slate-900">{greeting.title}</h2>
      <p className="mt-1 text-slate-700">{greeting.message}</p>
      <button
        type="button"
        onClick={() => {
          onShow();
          void markNewsSeen();
        }}
        className="mt-3 rounded-full bg-sea-700 px-4 py-2 text-sm font-medium text-white hover:bg-sea-800"
      >
        Ukázať mi ich
      </button>
    </section>
  );
}
