"use client";

import Link from "next/link";
import { formatPrice, roomsLabel, seaLabel } from "@/lib/format";
import { listingBadge } from "@/lib/seen";
import type { Property } from "@/lib/types";
import { SaveButton } from "./SaveButton";
import { useOpened } from "./seen-store";
import { ICONS, Icon } from "./ui";

const BADGES = {
  new: { label: "Nové", className: "bg-sun text-on-sun" },
  unseen: { label: "Nevidela", className: "bg-accent text-on-accent" },
  seen: { label: "Videla", className: "bg-surface/90 text-ink-2" },
} as const;

export function ListingCard({
  property,
  saved,
  selected = false,
  isNew = false,
  seen = false,
  previousPrice = null,
  gone = false,
  enterDelayMs = 0,
  onSelect,
}: {
  property: Property;
  saved: boolean;
  selected?: boolean;
  isNew?: boolean;
  /** Adelka has opened this listing before (remembered on the server). */
  seen?: boolean;
  /** Price before a recent drop. */
  previousPrice?: number | null;
  /** No longer on offer (sold or withdrawn). */
  gone?: boolean;
  /** Cards in a list come in one after another. */
  enterDelayMs?: number;
  onSelect?: (id: string) => void;
}) {
  const opened = useOpened(property.id);
  const badge = listingBadge(isNew, seen || opened);
  const photo = property.photos[0];
  const meta = [
    property.area_sqm ? `${property.area_sqm} m²` : null,
    property.rooms ? roomsLabel(property.rooms) : null,
    property.sea_km != null ? seaLabel(property.sea_km) : null,
  ].filter(Boolean);

  return (
    <article
      id={`listing-${property.id}`}
      onMouseEnter={() => onSelect?.(property.id)}
      style={{ animationDelay: `${enterDelayMs}ms` }}
      className={`group relative animate-fade-up overflow-hidden rounded-3xl bg-surface shadow-card transition ${
        selected ? "ring-2 ring-accent" : ""
      }`}
    >
      <Link href={`/inzerat/${property.id}`} className="block">
        <div className="relative aspect-[16/9] max-h-44 w-full overflow-hidden bg-surface-2 sm:aspect-[3/2] sm:max-h-none">
          {photo && (
            <img
              src={photo}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
            />
          )}
          {/* One badge: Nové (yellow), else whether she has opened it (Nevidela stands out, Videla stays quiet). */}
          <span
            className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${BADGES[badge].className}`}
          >
            {badge === "seen" && <Icon d={ICONS.check} size={12} />}
            {BADGES[badge].label}
          </span>
          {gone && (
            <span className="absolute inset-x-0 bottom-0 bg-slate-900/75 px-3 py-1.5 text-center text-xs font-semibold text-white">
              Už nie je v ponuke
            </span>
          )}
        </div>
        <div className="space-y-1 px-4 pb-4 pt-3">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className={`font-display text-2xl font-semibold ${gone ? "text-faint line-through" : "text-ink"}`}>
              {formatPrice(property.price)}
            </span>
            {previousPrice !== null && (
              <>
                <span className="text-sm text-muted line-through">{formatPrice(previousPrice)}</span>
                <span className="text-sm font-bold text-success">zlacnel</span>
              </>
            )}
          </p>
          <p className="truncate text-[15px] font-medium text-ink">{property.title}</p>
          {meta.length > 0 && <p className="text-sm text-muted">{meta.join(" · ")}</p>}
          <p className="flex items-center gap-1 truncate text-sm text-muted">
            <Icon d={ICONS.pin} size={15} className="shrink-0" />
            <span className="truncate">
              {property.city}, {property.region}
            </span>
          </p>
        </div>
      </Link>
      <div className="absolute right-2.5 top-2.5">
        <SaveButton propertyId={property.id} saved={saved} />
      </div>
    </article>
  );
}
