import { redirect } from "next/navigation";
import { CloseBar } from "@/components/CloseBar";
import { hasSession } from "@/lib/session";
import { SettingsContent } from "./SettingsContent";

export const dynamic = "force-dynamic";
/** Saving a new distance from the sea fetches listings from Apify inside the server action. */
export const maxDuration = 300;

/** Opened directly (link, refresh). From the app the settings open as a panel over the map (@modal). */
export default async function SettingsPage() {
  if (!(await hasSession())) redirect("/prihlasenie?next=/nastavenia");
  return (
    <main className="mx-auto w-full max-w-md space-y-4 px-4 pb-6 pt-2">
      <CloseBar label="Zavrieť nastavenia" />
      <SettingsContent />
    </main>
  );
}
