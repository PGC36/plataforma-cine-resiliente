import type { MovieDTO } from "./Movie.DTO";

/** Raw envelope from the catalog endpoint (movies.json). */
export interface MoviesResponseDTO {
  movies: MovieDTO[];
}
