import { redirect } from "next/navigation";
import { ListingDetail } from "@/components/ListingDetail";
import { CloseBar } from "@/components/CloseBar";
import { hasSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Opened directly (shared link, refresh): the listing as a full page. From the list it opens in the side panel. */
export default async function ListingPage({ params }: PageProps<"/inzerat/[id]">) {
  const { id } = await params;
  if (!(await hasSession())) redirect(`/prihlasenie?next=${encodeURIComponent(`/inzerat/${id}`)}`);
  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-6 pt-2 lg:max-w-screen-2xl">
      <CloseBar label="Zavrieť detail" />
      <ListingDetail id={id} />
    </main>
  );
}
