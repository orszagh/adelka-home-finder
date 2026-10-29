"use client";

import { useEffect } from "react";
import { markListingSeen } from "@/app/actions";
import { rememberOpened } from "./seen-store";

/** Placed in the listing detail: opening it marks the house as seen. */
export function MarkSeen({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    rememberOpened(propertyId);
    // Offline or a hiccup: it only means the badge says "Nevidela" a bit longer.
    markListingSeen(propertyId).catch(() => {});
  }, [propertyId]);
  return null;
}
