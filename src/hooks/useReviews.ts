"use client";

import { useEffect, useState } from "react";
import { getReviews } from "@/services/Reviews.Service";
import type { Review } from "@/entities/Review";

interface ReviewsState {
  reviews: Review[] | null;
  loading: boolean;
}

/** reviews stays null if the simulated service fails — non-fatal, see AGENTS.md. */
export function useReviews(): ReviewsState {
  const [state, setState] = useState<ReviewsState>({ reviews: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    getReviews()
      .then((reviews) => {
        if (!cancelled) setState({ reviews, loading: false });
      })
      .catch((error: unknown) => {
        console.warn("Reviews service failed:", error);
        if (!cancelled) setState({ reviews: null, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
