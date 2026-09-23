"use client";

import { useEffect, useState } from "react";
import { MAX_INTENT, mailtoHref, type MessageDraft as Draft } from "@/lib/message";

const SUGGESTIONS = [
  "Mám záujem o tento dom. Je ešte k dispozícii?",
  "Chcela by som si dohodnúť obhliadku, ideálne v septembri.",
  "Môžete mi poslať viac fotiek a informácie o nákladoch na údržbu?",
  "Aká je vzdialenosť od mora a je možné parkovanie?",
];

const SIGNATURE_KEY = "adelka.signature";

export function MessageDraft({ propertyId, aiEnabled }: { propertyId: string; aiEnabled: boolean }) {
  const [intent, setIntent] = useState("");
  const [signature, setSignature] = useState("Adelka");
  const [to, setTo] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIGNATURE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
      if (stored) setSignature(stored);
    } catch {}
  }, []);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      try {
        localStorage.setItem(SIGNATURE_KEY, signature);
      } catch {}
      const response = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, intent, signature }),
      });
      const data = (await response.json().catch(() => ({}))) as { draft?: Draft; error?: string };
      if (!response.ok || !data.draft) throw new Error(data.error ?? "Správu sa nepodarilo pripraviť.");
      setDraft(data.draft);
      setSubject(data.draft.subject_it);
      setBody(data.draft.body_it);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Správu sa nepodarilo pripraviť.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopied(true);
    } catch {
      setError("Kopírovanie sa nepodarilo, označ text ručne.");
    }
  };

  const inputClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base font-normal";

  return (
    <section aria-labelledby="draft-heading" className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div>
        <h2 id="draft-heading" className="text-lg font-semibold">
          Napísať realitke
        </h2>
        <p className="text-sm text-slate-600">
          Napíš po slovensky, čo chceš povedať. AI pripraví taliansky email, ty ho skontroluješ a <strong>odošleš sama</strong>{" "}
          zo svojho emailu. Appka nič neodošle.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setIntent((v) => (v ? `${v} ${s}` : s))}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-200"
          >
            {s}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Čo chceš realitke povedať
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          rows={3}
          maxLength={MAX_INTENT}
          placeholder="Napr. mám záujem, chcem obhliadku v septembri, pýtam sa aj na parkovanie"
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Podpis
        <input value={signature} onChange={(e) => setSignature(e.target.value)} maxLength={80} className={inputClass} />
      </label>

      <button
        type="button"
        onClick={generate}
        disabled={!aiEnabled || loading || intent.trim().length === 0}
        className="rounded-full bg-sea-700 px-4 py-2 text-sm font-medium text-white hover:bg-sea-800 disabled:opacity-40"
      >
        {loading ? "Pripravujem…" : draft ? "✨ Pripraviť znova" : "✨ Pripraviť správu"}
      </button>
      {!aiEnabled && <p className="text-sm text-slate-500">AI zatiaľ nie je nastavená (chýba ANTHROPIC_API_KEY).</p>}

      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200" role="alert">
          {error}
        </p>
      )}

      {draft && (
        <div className="space-y-3 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-600">Návrh môžeš ľubovoľne upraviť:</p>
          <label className="block text-sm font-medium text-slate-700">
            Predmet (taliansky)
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Text emailu (taliansky)
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className={inputClass} />
          </label>
          <details className="rounded-xl bg-slate-50 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-slate-700">Čo v tom je po slovensky</summary>
            <p className="mt-2 whitespace-pre-line text-slate-700">{draft.translation_sk}</p>
            {body !== draft.body_it && (
              <p className="mt-2 text-xs text-amber-800">Preklad zodpovedá pôvodnému návrhu, nie tvojim úpravám.</p>
            )}
          </details>
          <label className="block text-sm font-medium text-slate-700">
            Email realitky (nájdeš ho v inzeráte)
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="agenzia@example.it"
              className={inputClass}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <a
              href={mailtoHref(to, subject, body)}
              className="rounded-full bg-sea-700 px-4 py-2 text-sm font-medium text-white hover:bg-sea-800"
            >
              ✉️ Otvoriť v mojom e-maile
            </a>
            <button
              type="button"
              onClick={copy}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            >
              {copied ? "Skopírované ✓" : "Kopírovať text"}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            „Otvoriť v mojom e-maile“ len pripraví správu v tvojej emailovej aplikácii. Odošle sa, až keď v nej ťukneš na
            Odoslať.
          </p>
        </div>
      )}
    </section>
  );
}
