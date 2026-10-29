import { redirect } from "next/navigation";
import { DetailPanel } from "@/components/DetailPanel";
import { hasSession } from "@/lib/session";
import { HelpContent } from "../../napoveda/HelpContent";

/** The help opened from the app: a panel over the map, so closing it is instant. */
export default async function HelpPanel() {
  if (!(await hasSession())) redirect("/prihlasenie?next=/napoveda");
  return (
    <DetailPanel label="Nápoveda" closeLabel="Zavrieť nápovedu" width="mx-auto max-w-3xl" belowHeader>
      <HelpContent />
    </DetailPanel>
  );
}
