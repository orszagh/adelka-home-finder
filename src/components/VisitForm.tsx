"use client";

import { useState, useTransition } from "react";
import { setVisit } from "@/app/actions";
import { VISIT_STATUSES, type Visit, type VisitStatus } from "@/lib/visits";
import { useToast } from "./Toast";
import { ICONS, Icon, buttonClass, chipClass } from "./ui";

const INPUT_CLASS = "mt-1 w-full rounded-2xl border border-line-strong bg-surface px-3.5 py-2.5 text-base font-normal text-ink";

/** Where Adelka is with a saved house, and the day of the viewing once it is agreed. */
export function VisitForm({ propertyId, visit }: { propertyId: string; visit: Visit | null }) {
  const [status, setStatus] = useState<VisitStatus | null>(visit?.status ?? null);
  const [date, setDate] = useState(visit?.date ?? "");
  const [time, setTime] = useState(visit?.time ?? "");
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const toast = useToast();

  const dirty = status !== (visit?.status ?? null) || date !== (visit?.date ?? "") || time !== (visit?.time ?? "");
  const withDate = status === "booked" || status === "visited";

  const save = () =>
    startTransition(async () => {
      const result = await setVisit(propertyId, status ? { status, date: withDate ? date || null : null, time: withDate ? time || null : null } : null);
      if (result.ok) setSavedAt(Date.now());
      else toast.show({ tone: "error", text: "Obhliadku sa nepodarilo uložiť, skús to znova." });
    });

  const change = (fn: () => void) => {
    fn();
    setSavedAt(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink-2">Obhliadka</p>
      <div className="flex flex-wrap gap-1.5">
        {VISIT_STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={status === s.value}
            // A second tap clears it again.
            onClick={() => change(() => setStatus(status === s.value ? null : s.value))}
            className={chipClass(status === s.value, "min-h-10")}
          >
            {s.label}
          </button>
        ))}
      </div>
      {withDate && (
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-ink-2">
            Dátum
            <input type="date" value={date} onChange={(e) => change(() => setDate(e.target.value))} className={INPUT_CLASS} />
          </label>
          <label className="block text-sm font-medium text-ink-2">
            Čas
            <input type="time" value={time} onChange={(e) => change(() => setTime(e.target.value))} className={INPUT_CLASS} />
          </label>
        </div>
      )}
      {(dirty || savedAt) && (
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={pending || !dirty} className={buttonClass("primary")}>
            {pending ? "Ukladám…" : "Uložiť obhliadku"}
          </button>
          {savedAt && !dirty && (
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <Icon d={ICONS.check} size={16} />
              Uložené
            </span>
          )}
        </div>
      )}
    </div>
  );
}
