"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import { ICONS, Icon } from "./ui";

/**
 * Listing detail over everything, on a phone and on a computer alike: the
 * whole screen belongs to the house. Closing goes back, so the phone's back
 * gesture closes it too.
 */
export function DetailPanel({ children }: { children: ReactNode }) {
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && router.back();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [router]);

  return (
    <aside
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label="Detail domčeka"
      tabIndex={-1}
      className="fixed inset-0 z-[1800] flex animate-rise flex-col bg-canvas outline-none"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-canvas px-3 py-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-accent-ink hover:bg-surface-2"
        >
          <Icon d={ICONS.back} size={16} />
          Späť
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Zavrieť detail"
          className="grid size-11 place-items-center rounded-full text-ink hover:bg-surface-2"
        >
          <Icon d={ICONS.close} size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-3xl lg:max-w-screen-2xl">{children}</div>
      </div>
    </aside>
  );
}
