import type { Movie } from "@/entities/Movie";

/**
 * ex src/core/filters.ts filterMovies(): translates each movie just to match
 * against its displayed title, but returns the original (untranslated)
 * objects — genre filtering already happened in useGenreFilter, and the
 * caller (MovieCard) translates again at render time.
 */
export function filterMoviesByText(
  movies: Movie[],
  text: string,
  translateMovie: (movie: Movie) => Movie
): Movie[] {
  const normalizedText = text.trim().toLowerCase();
  return movies.filter((movie) => translateMovie(movie).title.toLowerCase().includes(normalizedText));
}
