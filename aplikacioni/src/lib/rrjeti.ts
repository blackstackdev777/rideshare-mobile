"use client";

import { useSyncExternalStore } from "react";

function ndiqRrjetin(ndryshoi: () => void) {
  window.addEventListener("online", ndryshoi);
  window.addEventListener("offline", ndryshoi);
  return () => {
    window.removeEventListener("online", ndryshoi);
    window.removeEventListener("offline", ndryshoi);
  };
}

// Ky është vetëm sinjal i shfletuesit; true nuk provon lidhjen me Neon.
export function useLidhjaMeRrjetin() {
  return useSyncExternalStore(ndiqRrjetin, () => navigator.onLine, () => true);
}
