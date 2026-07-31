import type { Movie } from "../entities/Movie.js";

const DELAY_MS = 500;

export interface MovieFilter {
  filterByGenre(genre: string): Promise<Movie[]>;
}

export function createMovieFilter(movies: Movie[]): MovieFilter {
  const cache: Record<string, Promise<Movie[]> | Movie[]> = {};
  const genreToCanonicalMap: Record<string, string> = {};

  movies.forEach((movie) => {
    genreToCanonicalMap[movie.category] = movie.category;
    genreToCanonicalMap[movie.categoryEn] = movie.category;
  });

  function simulateGenreQuery(canonicalCategory: string): Promise<Movie[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(movies.filter((movie) => movie.category === canonicalCategory));
      }, DELAY_MS);
    });
  }

  async function filterByGenre(displayedGenre: string): Promise<Movie[]> {
    if (displayedGenre === "all") {
      return movies;
    }

    const canonicalCategory = genreToCanonicalMap[displayedGenre] ?? displayedGenre;

    const cached = cache[canonicalCategory];
    if (cached) {
      return cached;
    }

    const promise = simulateGenreQuery(canonicalCategory);
    cache[canonicalCategory] = promise;
    const result = await promise;
    cache[canonicalCategory] = result;
    return result;
  }

  return { filterByGenre };
}
