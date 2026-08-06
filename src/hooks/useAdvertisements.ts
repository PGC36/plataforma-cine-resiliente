"use client";

import { useEffect, useState } from "react";
import { getAdvertisements } from "@/services/Advertisements.Service";
import type { Advertisement } from "@/entities/Advertisement";

interface AdvertisementsState {
  advertisements: Advertisement[];
  loading: boolean;
}

/** advertisements stays [] if the simulated service fails — non-fatal, see AGENTS.md. */
export function useAdvertisements(): AdvertisementsState {
  const [state, setState] = useState<AdvertisementsState>({ advertisements: [], loading: true });

  useEffect(() => {
    let cancelled = false;

    getAdvertisements()
      .then((advertisements) => {
        if (!cancelled) setState({ advertisements, loading: false });
      })
      .catch((error: unknown) => {
        console.warn("Advertisements service failed:", error);
        if (!cancelled) setState({ advertisements: [], loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
