import { redirect } from "next/navigation";
import { DetailPanel } from "@/components/DetailPanel";
import { ListingDetail } from "@/components/ListingDetail";
import { hasSession } from "@/lib/session";

/** A listing opened from the list or the map: shown in the side panel, the map stays visible. */
export default async function ListingPanel({ params }: PageProps<"/inzerat/[id]">) {
  const { id } = await params;
  if (!(await hasSession())) redirect(`/prihlasenie?next=${encodeURIComponent(`/inzerat/${id}`)}`);
  return (
    <DetailPanel>
      <ListingDetail id={id} />
    </DetailPanel>
  );
}
