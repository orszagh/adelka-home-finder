"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import { CloseBar } from "./CloseBar";

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
      <CloseBar label="Zavrieť detail" onClose={() => router.back()} className="shrink-0 border-b border-line bg-canvas px-4 py-2" />
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-3xl lg:max-w-screen-2xl">{children}</div>
      </div>
    </aside>
  );
}
