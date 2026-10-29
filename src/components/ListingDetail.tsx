import { notFound } from "next/navigation";
import { Gallery } from "@/components/Gallery";
import { LocationSummary } from "@/components/LocationSummary";
import { MarkSeen } from "@/components/MarkSeen";
import { MessageDraft } from "@/components/MessageDraft";
import { NoteForm } from "@/components/NoteForm";
import { SaveButton } from "@/components/SaveButton";
import { VisitForm } from "@/components/VisitForm";
import { ICONS, Icon, buttonClass } from "@/components/ui";
import { isAiConfigured } from "@/lib/ai/claude";
import { distanceToSeaKm } from "@/lib/coast";
import { sameHouse } from "@/lib/duplicates";
import { getRepo } from "@/lib/db/repo";
import { formatDate, formatPrice, roomsLabel, seaLabel, sourceLabel } from "@/lib/format";
import { isStale } from "@/lib/freshness";
import { getProvider } from "@/lib/providers";
import { getVisits } from "@/lib/visits";

/**
 * Everything about one listing. Shown as a full page (/inzerat/[id] opened
 * directly) or in the side panel over the map (opened from the list).
 */
export async function ListingDetail({ id }: { id: string }) {
  const repo = getRepo();
  const [property, saved, all, visits] = await Promise.all([
    repo.getProperty(id),
    repo.listSaved(),
    repo.listProperties(),
    getVisits(repo),
  ]);
  if (!property) notFound();
  const locationNote = await repo.getLocationNote(property.city, property.region);
  const twins = all.filter((p) => p.id !== property.id && sameHouse(property, p));
  const savedEntry = saved.find((s) => s.property_id === property.id) ?? null;

  const facts = [
    ["Cena", formatPrice(property.price)],
    ["Plocha", property.area_sqm ? `${property.area_sqm} m²` : "neuvedené"],
    ["Izby", property.rooms ? roomsLabel(property.rooms) : "neuvedené"],
    [
      "Cena za m²",
      property.price && property.area_sqm ? formatPrice(Math.round(property.price / property.area_sqm)) : "–",
    ],
    ["Od mora", seaLabel(distanceToSeaKm(property.longitude, property.latitude))],
    ["Zdroj", [property, ...twins].map((p) => sourceLabel(p.source)).join(" aj ")],
    ["V appke od", formatDate(property.first_seen_at)],
  ];

  return (
    <div className="space-y-6">
      <MarkSeen propertyId={property.id} />
      {!getProvider().isMock && isStale(property) && (
        <p className="rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn-ink">
          Tento inzerát už na portáli nie je (naposledy videný {formatDate(property.last_seen_at)}). Dom je
          pravdepodobne predaný alebo stiahnutý z ponuky.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div className="lg:sticky lg:top-0">
          <Gallery photos={property.photos} title={property.title} />
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-3xl font-semibold text-ink lg:text-4xl">{formatPrice(property.price)}</p>
              <h1 className="mt-1 text-lg font-medium text-ink">{property.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-muted">
                <Icon d={ICONS.pin} size={16} />
                {property.city}, {property.region}
              </p>
            </div>
            <SaveButton propertyId={property.id} saved={savedEntry !== null} variant="full" />
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-surface p-3.5 shadow-card">
                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</dt>
                <dd className="mt-1 font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-3">
            {property.listing_url ? (
              <a
                href={property.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("secondary")}
              >
                <Icon d={ICONS.external} size={18} />
                Pôvodný inzerát
              </a>
            ) : (
              <span className="inline-flex min-h-11 items-center rounded-full px-4 text-sm text-muted ring-1 ring-line">
                Ukážkový inzerát bez odkazu na portál
              </span>
            )}
            {/* On a phone these open the Google Maps or Waze app straight into navigation. */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary")}
            >
              <Icon d={ICONS.navigate} size={18} />
              Google Maps
            </a>
            <a
              href={`https://waze.com/ul?ll=${property.latitude},${property.longitude}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary")}
            >
              <Icon d={ICONS.navigate} size={18} />
              Waze
            </a>
          </div>
          {twins.map((t) => (
            <p key={t.id} className="-mt-3 text-sm text-ink-2">
              Ten istý domček je aj na {sourceLabel(t.source)} za <b>{formatPrice(t.price)}</b>
              {t.listing_url && (
                <>
                  {" · "}
                  <a href={t.listing_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-ink underline">
                    otvoriť inzerát
                  </a>
                </>
              )}
            </p>
          ))}
          <p className="-mt-3 text-xs text-muted">
            Portály často uvádzajú len približnú polohu, adresu si over v inzeráte alebo u realitky.
          </p>

          {savedEntry && (
            <section className="rounded-3xl bg-surface p-5 shadow-card">
              <NoteForm savedId={savedEntry.id} note={savedEntry.note} />
              <div className="mt-5 border-t border-line pt-4">
                <VisitForm propertyId={property.id} visit={visits[property.id] ?? null} />
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-10">
        <LocationSummary
          propertyId={property.id}
          city={property.city}
          initialNote={locationNote}
          aiEnabled={isAiConfigured()}
        />
        <MessageDraft propertyId={property.id} aiEnabled={isAiConfigured()} />
      </div>
    </div>
  );
}
