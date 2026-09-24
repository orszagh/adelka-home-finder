import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Gallery } from "@/components/Gallery";
import { LocationSummary } from "@/components/LocationSummary";
import { MessageDraft } from "@/components/MessageDraft";
import { isAiConfigured } from "@/lib/ai/claude";
import { NoteForm } from "@/components/NoteForm";
import { SaveButton } from "@/components/SaveButton";
import { getRepo } from "@/lib/db/repo";
import { formatDate, formatPrice, roomsLabel } from "@/lib/format";
import { isStale } from "@/lib/freshness";
import { getProvider } from "@/lib/providers";
import { hasSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<string, string> = {
  immobiliare: "Immobiliare.it",
  idealista: "Idealista.it",
};

export default async function ListingPage({ params }: PageProps<"/inzerat/[id]">) {
  const { id } = await params;
  if (!(await hasSession())) redirect(`/prihlasenie?next=${encodeURIComponent(`/inzerat/${id}`)}`);
  const repo = getRepo();
  const [property, saved] = await Promise.all([repo.getProperty(id), repo.listSaved()]);
  if (!property) notFound();
  const locationNote = await repo.getLocationNote(property.city, property.region);
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
      <Link href="/" className="text-sm font-medium text-accent-ink hover:underline">
        ‹ Späť na ponuky
      </Link>

      {!getProvider().isMock && isStale(property) && (
        <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm text-ink-2 ring-1 ring-line">
          Tento inzerát už na portáli nie je (naposledy videný {formatDate(property.last_seen_at)}). Dom je
          pravdepodobne predaný alebo stiahnutý z ponuky.
        </p>
      )}

      <Gallery photos={property.photos} title={property.title} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{property.title}</h1>
          <p className="mt-1 text-muted">
            📍 {property.city}, {property.region}
          </p>
        </div>
        <SaveButton propertyId={property.id} saved={savedEntry !== null} variant="full" />
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {facts.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-surface p-3 ring-1 ring-line">
            <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
            <dd className="mt-0.5 font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-3">
        {property.listing_url ? (
          <a
            href={property.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-4 py-2 text-sm font-medium text-accent-ink ring-1 ring-accent hover:bg-accent-soft"
          >
            Pôvodný inzerát ↗
          </a>
        ) : (
          <span className="rounded-full px-4 py-2 text-sm text-muted ring-1 ring-line">
            Ukážkový inzerát bez odkazu na portál
          </span>
        )}
        <a
          href={`https://www.openstreetmap.org/?mlat=${property.latitude}&mlon=${property.longitude}#map=15/${property.latitude}/${property.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full px-4 py-2 text-sm font-medium text-ink-2 ring-1 ring-line-strong hover:bg-surface-2"
        >
          Na mape ↗
        </a>
      </div>

      {savedEntry && (
        <section className="rounded-2xl bg-surface p-4 ring-1 ring-line">
          <NoteForm savedId={savedEntry.id} note={savedEntry.note} />
        </section>
      )}

      <LocationSummary
        propertyId={property.id}
        city={property.city}
        initialNote={locationNote}
        aiEnabled={isAiConfigured()}
      />

      <MessageDraft propertyId={property.id} aiEnabled={isAiConfigured()} />
    </main>
  );
}
