"use client";

import { useEffect, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Registers the service worker (public/sw.js) that keeps the last seen houses,
 * photos and map on the phone, and says so when there is no signal.
 * Only in production: in development it would serve stale code.
 */
export function OfflineSupport() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => console.error("Service worker registration failed", error));
  }, []);

  if (online) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-3 top-[72px] z-[1700] mx-auto max-w-md animate-drop rounded-2xl bg-warn-soft px-4 py-2.5 text-sm font-semibold text-warn-ink shadow-lift"
    >
      Si bez signálu. Ukazujem domčeky, ktoré mám naposledy uložené.
    </div>
  );
}
