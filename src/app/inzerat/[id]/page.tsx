import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/Gallery";
import { NoteForm } from "@/components/NoteForm";
import { SaveButton } from "@/components/SaveButton";
import { getRepo } from "@/lib/db/repo";
import { formatDate, formatPrice, roomsLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<string, string> = {
  immobiliare: "Immobiliare.it",
  idealista: "Idealista.it",
};

export default async function ListingPage({ params }: PageProps<"/inzerat/[id]">) {
  const { id } = await params;
  const repo = getRepo();
  const [property, saved] = await Promise.all([repo.getProperty(id), repo.listSaved()]);
  if (!property) notFound();
  const savedEntry = saved.find((s) => s.property_id === property.id) ?? null;

  const facts = [
    ["Cena", formatPrice(property.price)],
    ["Plocha", property.area_sqm ? `${property.area_sqm} m²` : "neuvedené"],
    ["Izby", property.rooms ? roomsLabel(property.rooms) : "neuvedené"],
    [
      "Cena za m²",
      property.price && property.area_sqm ? formatPrice(Math.round(property.price / property.area_sqm)) : "–",
    ],
    ["Lokalita", `${property.city}, ${property.region}`],
    ["Zdroj", SOURCE_LABELS[property.source] ?? property.source],
    ["V appke od", formatDate(property.first_seen_at)],
  ];

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <Link href="/" className="text-sm font-medium text-sea-700 hover:underline">
        ‹ Späť na ponuky
      </Link>

      <Gallery photos={property.photos} title={property.title} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{property.title}</h1>
          <p className="mt-1 text-slate-600">
            📍 {property.city}, {property.region}
          </p>
        </div>
        <SaveButton propertyId={property.id} saved={savedEntry !== null} variant="full" />
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {facts.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-3">
        {property.listing_url ? (
          <a
            href={property.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-4 py-2 text-sm font-medium text-sea-800 ring-1 ring-sea-600 hover:bg-sea-50"
          >
            Pôvodný inzerát ↗
          </a>
        ) : (
          <span className="rounded-full px-4 py-2 text-sm text-slate-500 ring-1 ring-slate-200">
            Ukážkový inzerát bez odkazu na portál
          </span>
        )}
        <a
          href={`https://www.openstreetmap.org/?mlat=${property.latitude}&mlon=${property.longitude}#map=15/${property.latitude}/${property.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
        >
          Na mape ↗
        </a>
      </div>

      {savedEntry && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <NoteForm savedId={savedEntry.id} note={savedEntry.note} />
        </section>
      )}
    </main>
  );
}
