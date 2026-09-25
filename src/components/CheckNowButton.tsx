"use client";

import { useTransition } from "react";
import { checkNow } from "@/app/actions";
import { SyncSheet } from "./SyncSheet";
import { useToast } from "./Toast";
import { Button, ICONS, Icon } from "./ui";

export function CheckNowButton({ waitMinutes }: { waitMinutes: number }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const run = () =>
    startTransition(async () => {
      const result = await checkNow();
      toast.show(result.ok ? { tone: "success", text: "Hotovo, ponuky sú aktuálne." } : { tone: "error", text: result.error });
    });

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
      <Button
        variant="secondary"
        onClick={run}
        disabled={pending || waitMinutes > 0}
        title="Stiahne čerstvé ponuky pre všetky tvoje oblasti (najviac raz za hodinu)"
      >
        <Icon d={ICONS.refresh} size={18} className={pending ? "animate-spin" : ""} />
        {pending ? "Pozerám na portáloch…" : "Pozrieť teraz"}
      </Button>
      {!pending && waitMinutes > 0 && <span className="text-xs text-muted">Znova to pôjde o {waitMinutes} min.</span>}
      <SyncSheet open={pending} subtitle="Všetky tvoje oblasti" />
    </div>
  );
}
