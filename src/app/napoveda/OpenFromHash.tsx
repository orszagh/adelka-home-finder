"use client";

import { useEffect } from "react";

/** A link like /napoveda#okolie opens that answer and scrolls to it. */
export function OpenFromHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (target instanceof HTMLDetailsElement) {
      target.open = true;
      target.scrollIntoView({ block: "start" });
    }
  }, []);
  return null;
}
