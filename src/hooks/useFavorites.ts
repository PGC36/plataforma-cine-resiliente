"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "favorite-movies";

function loadFavorites(): Set<number> {
  const saved = localStorage.getItem(STORAGE_KEY);
  return new Set(saved ? (JSON.parse(saved) as number[]) : []);
}

interface UseFavoritesResult {
  isFavorite: (id: number) => boolean;
  toggleFavorite: (id: number) => boolean;
  count: number;
}

export function useFavorites(): UseFavoritesResult {
  const [favorites, setFavorites] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    // localStorage isn't available during SSR: hydrate with the default
    // empty Set on first render, then sync the real value after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavorites(loadFavorites());
  }, []);

  const toggleFavorite = useCallback(
    (id: number): boolean => {
      const willBeFavorite = !favorites.has(id);
      const next = new Set(favorites);
      if (willBeFavorite) {
        next.add(id);
      } else {
        next.delete(id);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      setFavorites(next);
      return willBeFavorite;
    },
    [favorites]
  );

  const isFavorite = useCallback((id: number) => favorites.has(id), [favorites]);

  return { isFavorite, toggleFavorite, count: favorites.size };
}
