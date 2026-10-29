import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CloseBar } from "@/components/CloseBar";
import { hasSession } from "@/lib/session";
import { HelpContent } from "./HelpContent";

export const metadata: Metadata = { title: "Nápoveda" };

/** Opened directly (link, refresh). From the app the help opens as a panel over the map (@modal). */
export default async function HelpPage() {
  if (!(await hasSession())) redirect("/prihlasenie?next=/napoveda");
  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 pb-6 pt-2">
      <CloseBar label="Zavrieť nápovedu" />
      <HelpContent />
    </main>
  );
}
