import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingDetail } from "@/components/ListingDetail";
import { ICONS, Icon } from "@/components/ui";
import { hasSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Opened directly (shared link, refresh): the listing as a full page. From the list it opens in the side panel. */
export default async function ListingPage({ params }: PageProps<"/inzerat/[id]">) {
  const { id } = await params;
  if (!(await hasSession())) redirect(`/prihlasenie?next=${encodeURIComponent(`/inzerat/${id}`)}`);
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <Link href="/" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent-ink hover:underline">
        <Icon d={ICONS.back} size={16} />
        Späť na ponuky
      </Link>
      <ListingDetail id={id} />
    </main>
  );
}
