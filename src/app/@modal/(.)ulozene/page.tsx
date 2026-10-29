import { redirect } from "next/navigation";
import { DetailPanel } from "@/components/DetailPanel";
import { hasSession } from "@/lib/session";
import { SavedContent } from "../../ulozene/SavedContent";

export const dynamic = "force-dynamic";

/** Uložené opened from the app: a panel over the map, so closing it is instant (no new map). */
export default async function SavedPanel() {
  if (!(await hasSession())) redirect("/prihlasenie?next=/ulozene");
  return (
    <DetailPanel label="Uložené" closeLabel="Zavrieť uložené" width="mx-auto max-w-3xl" belowHeader>
      <SavedContent />
    </DetailPanel>
  );
}
