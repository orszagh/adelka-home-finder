"use client";

import Link from "next/link";
import { formatPrice, roomsLabel } from "@/lib/format";
import type { Property } from "@/lib/types";
import { SaveButton } from "./SaveButton";

export function ListingCard({
  property,
  saved,
  selected = false,
  isNew = false,
  onSelect,
}: {
  property: Property;
  saved: boolean;
  selected?: boolean;
  isNew?: boolean;
  onSelect?: (id: string) => void;
}) {
  const photo = property.photos[0];
  return (
    <article
      id={`listing-${property.id}`}
      onMouseEnter={() => onSelect?.(property.id)}
      className={`group relative flex gap-3 rounded-2xl bg-white p-2 shadow-sm ring-1 transition ${
        selected ? "ring-2 ring-sea-600" : "ring-slate-200 hover:ring-slate-300"
      }`}
    >
      <Link href={`/inzerat/${property.id}`} className="flex min-w-0 flex-1 gap-3">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-40">
          {photo && (
            <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
          )}
          {isNew && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-950">
              Nové
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 py-1 pr-10">
          <p className="text-lg font-semibold text-slate-900">{formatPrice(property.price)}</p>
          <p className="truncate text-sm text-slate-700">{property.title}</p>
          <p className="mt-1 text-sm text-slate-500">
            {[
              property.area_sqm ? `${property.area_sqm} m²` : null,
              property.rooms ? roomsLabel(property.rooms) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="truncate text-sm text-slate-500">
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
