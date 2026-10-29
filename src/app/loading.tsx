/** Shown at once while a page Adelka has not seen recently loads over a weak signal. */
export default function Loading() {
  return (
    <main className="grid flex-1 place-items-center px-4 py-16" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-muted">
        <span className="size-9 animate-spin rounded-full border-[3px] border-line border-t-accent" aria-hidden />
        <span className="text-sm font-medium">Chvíľku, načítavam…</span>
      </div>
    </main>
  );
}
