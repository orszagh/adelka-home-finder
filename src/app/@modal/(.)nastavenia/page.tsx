import { redirect } from "next/navigation";
import { DetailPanel } from "@/components/DetailPanel";
import { hasSession } from "@/lib/session";
import { SettingsContent } from "../../nastavenia/SettingsContent";

export const dynamic = "force-dynamic";
/** Saving a new distance from the sea fetches listings from Apify inside the server action. */
export const maxDuration = 300;

/** The search settings opened from the app: a panel over the map, so closing it is instant. */
export default async function SettingsPanel() {
  if (!(await hasSession())) redirect("/prihlasenie?next=/nastavenia");
  return (
    <DetailPanel label="Nastavenia hľadania" closeLabel="Zavrieť nastavenia" width="mx-auto max-w-md" belowHeader>
      <SettingsContent />
    </DetailPanel>
  );
}
