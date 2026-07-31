import type { MovieDTO } from "./Movie.DTO.js";

/** Raw envelope from the catalog endpoint (movies.json). */
export interface MoviesResponseDTO {
  movies: MovieDTO[];
}
