"use client";

import { useState, useTransition } from "react";
import { updateSavedNote } from "@/app/actions";

export function NoteForm({ savedId, note }: { savedId: string; note: string | null }) {
  const [value, setValue] = useState(note ?? "");
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const dirty = value !== (note ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await updateSavedNote(savedId, value);
          setSavedAt(Date.now());
        });
      }}
      className="space-y-2"
    >
      <label className="block text-sm font-medium text-ink-2">
        Moja poznámka
        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSavedAt(null);
          }}
          rows={3}
          maxLength={2000}
          placeholder="Napr. páči sa mi terasa, overiť parkovanie…"
          className="mt-1 w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-base font-normal"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !dirty}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent disabled:opacity-40"
        >
          {pending ? "Ukladám…" : "Uložiť poznámku"}
        </button>
        {savedAt && !dirty && <span className="text-sm text-success">Uložené ✓</span>}
      </div>
    </form>
  );
}
