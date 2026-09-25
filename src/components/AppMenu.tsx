"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useId, useRef, useState, useTransition } from "react";
import { logout } from "@/app/session-actions";
import { setTheme } from "@/app/theme-actions";
import type { Theme } from "@/lib/theme";
import { Logo } from "./Logo";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Svetlý" },
  { value: "dark", label: "Tmavý" },
  { value: "system", label: "Ako mobil" },
];

/** Applied right away; the cookie (setTheme) makes the server render it next time. */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  menu: "M4 7h16M4 12h16M4 17h10",
  close: "M6 6l12 12M18 6L6 18",
  home: "M3 11l9-7 9 7v9H3zM10 20v-5h4v5",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  sliders: "M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4",
  logout: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l4-4-4-4M14 12H4",
};

/** Hamburger menu: pages, search settings, light/dark theme and signing out. */
export function AppMenu({
  savedCount,
  settingsLabel,
  theme: initialTheme,
}: {
  savedCount: number;
  settingsLabel: string;
  theme: Theme;
}) {
  const [open, setOpen] = useState(false);
  const [theme, setThemeState] = useState(initialTheme);
  const [, startTransition] = useTransition();
  const pathname = usePathname();
  const panelId = useId();
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      closeButton.current?.focus();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
      document.addEventListener("keydown", onKey);
      wasOpen.current = true;
      return () => {
        document.body.style.overflow = previous;
        document.removeEventListener("keydown", onKey);
      };
    }
    if (wasOpen.current) openButton.current?.focus();
  }, [open]);

  const chooseTheme = (value: Theme) => {
    setThemeState(value);
    applyTheme(value);
    startTransition(() => setTheme(value));
  };

  const item = (href: string, icon: string, label: ReactNode, extra?: ReactNode) => {
    const current = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        aria-current={current ? "page" : undefined}
        className={`flex min-h-13 items-center gap-3 rounded-2xl px-3.5 py-2 text-base ${
          current ? "bg-accent-soft font-semibold text-accent-ink" : "font-medium text-ink hover:bg-surface-2"
        }`}
      >
        <Icon d={icon} />
        <span className="flex-1">{label}</span>
        {extra}
      </Link>
    );
  };

  return (
    <>
      <button
        ref={openButton}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Otvoriť menu"
        aria-expanded={open}
        aria-controls={panelId}
        className="grid size-11 place-items-center rounded-2xl bg-surface text-ink shadow-sm ring-1 ring-line hover:bg-surface-2"
      >
        <Icon d={ICONS.menu} />
      </button>

      <div
        className={`fixed inset-0 z-[2000] transition-opacity duration-200 motion-reduce:transition-none ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-overlay" onClick={() => setOpen(false)} />
        <div
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          inert={!open}
          className={`absolute inset-y-0 right-0 flex w-[min(320px,85vw)] flex-col gap-1.5 overflow-y-auto rounded-l-3xl bg-canvas p-4 shadow-2xl transition-transform duration-200 ease-out motion-reduce:transition-none ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="flex-1">
              <Logo size={32} />
            </span>
            <button
              ref={closeButton}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Zavrieť menu"
              className="grid size-11 place-items-center rounded-2xl text-ink hover:bg-surface-2"
            >
              <Icon d={ICONS.close} />
            </button>
          </div>

          <nav aria-label="Hlavné" className="flex flex-col gap-1">
            {item("/", ICONS.home, "Domčeky")}
            {item(
              "/ulozene",
              ICONS.heart,
              "Uložené",
              savedCount > 0 && (
                <span className="grid min-w-6.5 place-items-center rounded-full bg-love px-2 py-0.5 text-sm font-bold text-on-love">
                  {savedCount}
                </span>
              ),
            )}
            {item(
              "/nastavenia",
              ICONS.sliders,
              <span className="flex flex-col">
                <span>Nastavenia hľadania</span>
                <span className="text-sm font-normal text-muted">{settingsLabel}</span>
              </span>,
            )}
          </nav>

          <div className="my-3 h-px bg-line" />

          <p id={`${panelId}-theme`} className="px-3.5 text-xs font-bold uppercase tracking-widest text-muted">
            Vzhľad
          </p>
          <div role="group" aria-labelledby={`${panelId}-theme`} className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-2 p-1">
            {THEME_OPTIONS.map((o) => {
              const on = theme === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => chooseTheme(o.value)}
                  className={`min-h-11 rounded-xl text-sm font-semibold transition-colors ${
                    on ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          <form action={logout}>
            <button
              type="submit"
              className="flex min-h-13 w-full items-center gap-3 rounded-2xl px-3.5 text-base font-semibold text-love hover:bg-love-soft"
            >
              <Icon d={ICONS.logout} />
              Odhlásiť sa
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
