"use client";

import { useEffect, useState } from "react";
import { getCatalog } from "@/services/Catalog.Service";
import type { Movie } from "@/entities/Movie";

interface CatalogState {
  movies: Movie[];
  loading: boolean;
  error: Error | null;
}

export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({ movies: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    getCatalog()
      .then((movies) => {
        if (!cancelled) setState({ movies, loading: false, error: null });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ movies: [], loading: false, error });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
