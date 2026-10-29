"use client";

import { useEffect } from "react";
import { markListingSeen } from "@/app/actions";
import { isLubkoDevice } from "./ActivityPing";
import { rememberOpened } from "./seen-store";

/** Placed in the listing detail: opening it marks the house as seen (by Adelka, not on Lubko's devices). */
export function MarkSeen({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    // Lubko looking at a house must not mark it as seen by Adelka.
    if (isLubkoDevice()) return;
    rememberOpened(propertyId);
    // Offline or a hiccup: it only means the badge says "Nevidela" a bit longer.
    markListingSeen(propertyId).catch(() => {});
  }, [propertyId]);
  return null;
}
