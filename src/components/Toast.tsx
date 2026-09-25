"use client";

import Link from "next/link";
import { type ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { ICONS, Icon } from "./ui";

export type ToastInput = {
  tone: "success" | "error" | "info";
  text: string;
  /** Optional link shown after the text, e.g. back to the listings. */
  action?: { href: string; label: string };
};
type ToastItem = ToastInput & { id: number };

const ToastContext = createContext<{ show: (toast: ToastInput) => void }>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

/** Successes fade after a few seconds; errors stay until Adelka closes them. */
const SUCCESS_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (toast: ToastInput) => {
      const id = nextId.current++;
      setToasts((all) => [...all.slice(-2), { ...toast, id }]);
      if (toast.tone !== "error") setTimeout(() => dismiss(id), SUCCESS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[72px] z-[1600] flex flex-col items-center gap-2 px-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-[420px] animate-drop items-center gap-3 rounded-2xl py-2 pl-4 pr-1.5 shadow-lift ${
              t.tone === "error"
                ? "bg-love-soft text-love-ink"
                : t.tone === "success"
                  ? "bg-accent text-on-accent"
                  : "bg-surface text-ink"
            }`}
          >
            <p className="flex-1 py-1.5 text-[15px] font-semibold">
              {t.text}
              {t.action && (
                <>
                  {" "}
                  <Link href={t.action.href} onClick={() => dismiss(t.id)} className="whitespace-nowrap underline">
                    {t.action.label}
                  </Link>
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Zavrieť hlásenie"
              className="grid size-11 shrink-0 place-items-center rounded-xl opacity-80 hover:opacity-100"
            >
              <Icon d={ICONS.close} size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
