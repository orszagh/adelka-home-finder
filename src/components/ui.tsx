import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/*
 * Small building blocks of the "Riviéra ráno" look: only class names, no
 * behaviour. Every control is at least 44 px tall so it is easy to tap.
 */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent shadow-sm hover:bg-accent-strong",
  secondary: "bg-surface text-accent-ink ring-1 ring-line-strong hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-ink",
  danger: "bg-love text-on-love shadow-sm hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  md: "min-h-11 px-4 text-[15px]",
  lg: "min-h-13 px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}

type ButtonProps = { variant?: Variant; size?: Size } & ComponentProps<"button">;

export function Button({ variant, size, className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

type ButtonLinkProps = { variant?: Variant; size?: Size } & ComponentProps<typeof Link>;

export function ButtonLink({ variant, size, className = "", ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-3xl bg-surface shadow-card ${className}`} {...props} />;
}

export function chipClass(active: boolean, extra = "") {
  return `inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors ${
    active ? "bg-ink text-canvas" : "bg-surface text-ink-2 ring-1 ring-line hover:bg-surface-2"
  } ${extra}`;
}

/** Small uppercase label above a heading, e.g. "Štvrtok ráno". */
export function Eyebrow({ children, tone = "love" }: { children: ReactNode; tone?: "love" | "muted" }) {
  return (
    <p className={`text-xs font-bold uppercase tracking-[0.14em] ${tone === "love" ? "text-love-ink" : "text-muted"}`}>
      {children}
    </p>
  );
}

/** Stroke icons in the style of the design (24 px grid, 2 px line). */
export function Icon({ d, size = 20, className = "" }: { d: string; size?: number; className?: string }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

export const ICONS = {
  pin: "M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  waves: "M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  back: "M15 18l-6-6 6-6",
  chevronDown: "M6 9l6 6 6-6",
  refresh: "M20 11a8 8 0 0 0-14.9-3M4 5v3h3M4 13a8 8 0 0 0 14.9 3M20 19v-3h-3",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  close: "M6 6l12 12M18 6L6 18",
};
