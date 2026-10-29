import { redirect } from "next/navigation";
import { CloseBar } from "@/components/CloseBar";
import { hasSession } from "@/lib/session";
import { SavedContent } from "./SavedContent";

export const dynamic = "force-dynamic";

/** Opened directly (link, refresh). From the app Uložené opens as a panel over the map (@modal). */
export default async function SavedPage() {
  if (!(await hasSession())) redirect("/prihlasenie?next=/ulozene");
  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 pb-6 pt-2">
      <CloseBar label="Zavrieť uložené" />
      <SavedContent />
    </main>
  );
}
