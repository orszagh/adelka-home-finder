"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import { ICONS, Icon } from "./ui";

/**
 * Listing detail over the map: a wide panel on the right on a computer,
 * the whole screen on a phone. Closing goes back, so the phone's back
 * gesture closes it too.
 */
export function DetailPanel({ children }: { children: ReactNode }) {
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && router.back();
    document.addEventListener("keydown", onKey);
    // Only phones cover the page; on a computer the list and map stay usable.
    const phone = window.matchMedia("(max-width: 1023px)").matches;
    const previous = document.body.style.overflow;
    if (phone) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [router]);

  return (
    <aside
      ref={panel}
      role="dialog"
      aria-modal="false"
      aria-label="Detail domčeka"
      tabIndex={-1}
      className="fixed inset-0 z-[1800] flex animate-rise flex-col bg-canvas outline-none lg:bottom-0 lg:left-auto lg:right-0 lg:top-[65px] lg:w-[min(760px,52vw)] lg:border-l lg:border-line lg:shadow-lift"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-canvas px-3 py-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-accent-ink hover:bg-surface-2"
        >
          <Icon d={ICONS.back} size={16} />
          Späť na mapu
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
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
    </aside>
  );
}
