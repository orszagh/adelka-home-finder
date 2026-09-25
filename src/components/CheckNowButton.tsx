"use client";

import { useState, useTransition } from "react";
import { checkNow } from "@/app/actions";
import { Button, ICONS, Icon } from "./ui";

export function CheckNowButton({ waitMinutes }: { waitMinutes: number }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const run = () =>
    startTransition(async () => {
      setMessage(null);
      const result = await checkNow();
      setMessage(result.ok ? "Hotovo, ponuky sú aktuálne." : result.error);
    });

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
      <Button
        variant="secondary"
        onClick={run}
        disabled={pending || waitMinutes > 0}
        title="Stiahne čerstvé ponuky pre všetky tvoje oblasti (najviac raz za hodinu)"
      >
        <Icon d={ICONS.refresh} size={18} className={pending ? "animate-spin motion-reduce:animate-none" : ""} />
        {pending ? "Pozerám na portáloch…" : "Pozrieť teraz"}
      </Button>
      <span className="text-xs text-muted" role="status">
        {pending
          ? "Môže to trvať do minúty."
          : (message ?? (waitMinutes > 0 ? `Znova to pôjde o ${waitMinutes} min.` : null))}
      </span>
    </div>
  );
}
