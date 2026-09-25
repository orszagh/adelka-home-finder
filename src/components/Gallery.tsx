"use client";

import { useState } from "react";

export function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  if (photos.length === 0) {
    return <div className="grid aspect-[3/2] place-items-center rounded-3xl bg-surface-2 text-muted">Bez fotiek</div>;
  }

  const go = (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length);

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-3xl bg-surface-2 shadow-card">
        <img
          src={photos[index]}
          alt={`${title} – fotka ${index + 1} z ${photos.length}`}
          className="aspect-[3/2] w-full object-cover"
        />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Predchádzajúca fotka"
              className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-2xl text-ink shadow-card"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Ďalšia fotka"
              className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-2xl text-ink shadow-card"
            >
              ›
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              {index + 1} / {photos.length}
            </span>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Fotka ${i + 1}`}
              className={`shrink-0 overflow-hidden rounded-xl ring-2 ${i === index ? "ring-accent" : "ring-transparent"}`}
            >
              <img src={src} alt="" loading="lazy" className="h-14 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
