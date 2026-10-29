"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import { CloseBar } from "./CloseBar";

/**
 * A listing detail or a page from the menu over the map, on a phone and on a computer alike:
 * the whole screen belongs to it, while the map stays underneath and needs no loading when
 * it closes. Closing goes back, so the phone's back gesture closes it too.
 */
export function DetailPanel({
  children,
  label = "Detail domčeka",
  closeLabel = "Zavrieť detail",
  width = "mx-auto max-w-3xl lg:max-w-screen-2xl",
  belowHeader = false,
}: {
  children: ReactNode;
  label?: string;
  closeLabel?: string;
  /** Classes of the content column (the detail is wide on a computer, the menu pages are not). */
  width?: string;
  /** Menu pages keep the header (and the menu in it) visible above the panel. */
  belowHeader?: boolean;
}) {
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
      aria-label={label}
      tabIndex={-1}
      className={`fixed inset-x-0 bottom-0 z-[1800] flex animate-rise flex-col bg-canvas outline-none ${belowHeader ? "top-[65px]" : "top-0"}`}
    >
      <CloseBar label={closeLabel} onClose={() => router.back()} className="shrink-0 border-b border-line bg-canvas px-4 py-2" />
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
        <div className={width}>{children}</div>
      </div>
    </aside>
  );
}
