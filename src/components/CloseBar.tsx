"use client";

import { useClosePage } from "./navigation";
import { ICONS, Icon } from "./ui";

/**
 * The same top bar on every page from the menu, the listing page and the
 * listing panel: "Späť" on the left, ✕ on the right. Both close it the same
 * way – back to where Adelka was (home when there is nothing behind).
 */
export function CloseBar({ label, onClose, className = "" }: { label: string; onClose?: () => void; className?: string }) {
  const closePage = useClosePage();
  const close = onClose ?? closePage;

  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <button
        type="button"
        onClick={close}
        className="-ml-3 inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-accent-ink hover:bg-surface-2"
      >
        <Icon d={ICONS.back} size={16} />
        Späť
      </button>
      <button
        type="button"
        onClick={close}
        aria-label={label}
        className="-mr-2 grid size-11 place-items-center rounded-full text-ink hover:bg-surface-2"
      >
        <Icon d={ICONS.close} size={20} />
      </button>
    </div>
  );
}
