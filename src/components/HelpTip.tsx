"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { ICONS, Icon } from "./ui";

const CARD_WIDTH = 320;
/** Free space kept between the card and the edge of the screen, px. */
const EDGE = 12;

/**
 * A small "?" next to something that needs a word of explanation: a short card opens below it,
 * with a link to the whole answer in Nápoveda. Closes on a tap outside, Escape or the cross.
 */
export function HelpTip({
  label,
  title,
  children,
  href,
  className = "",
}: {
  /** Read aloud for the button, e.g. "Ako funguje okolie". */
  label: string;
  title: string;
  children: ReactNode;
  /** "Viac v Nápovede", e.g. /napoveda#okolie. */
  href?: string;
  className?: string;
}) {
  /** Where the card goes: under the button, moved sideways so it never leaves the screen. */
  const [place, setPlace] = useState<{ top: number; left: number } | null>(null);
  const open = place !== null;
  const root = useRef<HTMLDivElement>(null);
  const toggle = () => {
    if (open || !root.current) return setPlace(null);
    const button = root.current.getBoundingClientRect();
    const width = Math.min(CARD_WIDTH, window.innerWidth - 2 * EDGE);
    setPlace({ top: button.bottom + 8, left: Math.min(Math.max(EDGE, button.left), window.innerWidth - EDGE - width) });
  };
  const close = () => setPlace(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={toggle}
        className="grid size-10 place-items-center rounded-full bg-surface text-accent-ink shadow-lift"
      >
        <Icon d={ICONS.help} size={20} />
      </button>
      {place && (
        <div
          role="dialog"
          aria-labelledby={titleId}
          style={place}
          className="fixed z-[1300] w-[min(320px,calc(100vw-24px))] animate-drop space-y-2 rounded-3xl bg-surface p-4 text-[15px] leading-relaxed text-ink-2 shadow-lift"
        >
          <div className="flex items-start justify-between gap-2">
            <h2 id={titleId} className="font-display text-lg font-semibold text-ink">
              {title}
            </h2>
            <button
              type="button"
              aria-label="Zavrieť vysvetlenie"
              onClick={close}
              className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2"
            >
              <Icon d={ICONS.close} size={18} />
            </button>
          </div>
          {children}
          {href && (
            <Link href={href} className="inline-block font-semibold text-accent-ink underline">
              Viac v Nápovede
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
