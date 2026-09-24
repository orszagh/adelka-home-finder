"use client";

import Link from "next/link";
import { formatPrice, roomsLabel, seaLabel } from "@/lib/format";
import type { Property } from "@/lib/types";
import { SaveButton } from "./SaveButton";

export function ListingCard({
  property,
  saved,
  selected = false,
  isNew = false,
  previousPrice = null,
  gone = false,
  onSelect,
}: {
  property: Property;
  saved: boolean;
  selected?: boolean;
  isNew?: boolean;
  /** Price before a recent drop. */
  previousPrice?: number | null;
  /** No longer on offer (sold or withdrawn). */
  gone?: boolean;
  onSelect?: (id: string) => void;
}) {
  const photo = property.photos[0];
  return (
    <article
      id={`listing-${property.id}`}
      onMouseEnter={() => onSelect?.(property.id)}
      className={`group relative flex gap-3 rounded-2xl bg-surface p-2 shadow-sm ring-1 transition ${
        selected ? "ring-2 ring-accent" : "ring-line hover:ring-line-strong"
      }`}
    >
      <Link href={`/inzerat/${property.id}`} className="flex min-w-0 flex-1 gap-3">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:h-28 sm:w-40">
          {photo && (
            <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
          )}
          {gone && (
            <span className="absolute inset-x-0 bottom-0 bg-slate-900/75 px-2 py-1 text-center text-[11px] font-medium text-white">
              Už nie je v ponuke
            </span>
          )}
          {isNew && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-sun px-2 py-0.5 text-[11px] font-semibold text-on-sun">
              Nové
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 py-1 pr-10">
          <p className={`text-lg font-semibold ${gone ? "text-faint line-through" : "text-ink"}`}>
            {formatPrice(property.price)}
            {previousPrice !== null && (
              <span className="ml-2 align-middle text-sm font-medium text-success">
                <span className="text-faint line-through">{formatPrice(previousPrice)}</span> ▼
              </span>
            )}
          </p>
          <p className="truncate text-sm text-ink-2">{property.title}</p>
          <p className="mt-1 text-sm text-muted">
            {[
              property.area_sqm ? `${property.area_sqm} m²` : null,
              property.rooms ? roomsLabel(property.rooms) : null,
              property.sea_km != null ? seaLabel(property.sea_km) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="truncate text-sm text-muted">
            📍 {property.city}, {property.region}
          </p>
        </div>
      </Link>
      <div className="absolute right-2 top-2">
        <SaveButton propertyId={property.id} saved={saved} />
      </div>
    </article>
  );
}
