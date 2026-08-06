"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Movie } from "@/entities/Movie";

const DELAY_MS = 500;

interface UseGenreFilterResult {
  filterByGenre: (displayedGenre: string) => Promise<Movie[]>;
}

/**
 * ex src/cache/Filter.Cache.ts: filters movies by genre with a private cache,
 * so a genre already queried resolves instantly instead of repeating the
 * simulated latency. Keyed by canonical category (movie.category), never by
 * the <select> label, so the cache survives a language toggle.
 */
export function useGenreFilter(movies: Movie[]): UseGenreFilterResult {
  // Mutable cache, reset in an effect whenever `movies` changes identity
  // (only happens once, when the catalog finishes loading) — mutated later
  // from filterByGenre (an event/async callback, never during render).
  const cache = useRef<Map<string, Promise<Movie[]> | Movie[]>>(new Map());

  useEffect(() => {
    cache.current = new Map();
  }, [movies]);

  const genreToCanonicalMap = useMemo(() => {
    const map: Record<string, string> = {};
    movies.forEach((movie) => {
      map[movie.category] = movie.category;
      map[movie.categoryEn] = movie.category;
    });
    return map;
  }, [movies]);

  const filterByGenre = useCallback(
    async (displayedGenre: string): Promise<Movie[]> => {
      if (displayedGenre === "all") {
        return movies;
      }

      const canonicalCategory = genreToCanonicalMap[displayedGenre] ?? displayedGenre;

      const cached = cache.current.get(canonicalCategory);
      if (cached) {
        return cached;
      }

      const promise = new Promise<Movie[]>((resolve) => {
        setTimeout(() => {
          resolve(movies.filter((movie) => movie.category === canonicalCategory));
        }, DELAY_MS);
      });

      cache.current.set(canonicalCategory, promise);
      const result = await promise;
      cache.current.set(canonicalCategory, result);
      return result;
    },
    [movies, genreToCanonicalMap]
  );

  return { filterByGenre };
}
