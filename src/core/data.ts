import type { MovieDTO } from "../dtos/Movie.DTO.js";
import type { MoviesResponseDTO } from "../dtos/MoviesResponse.DTO.js";

export async function getMovies(): Promise<MovieDTO[]> {
  const response = await fetch("movies.json");

  if (!response.ok) {
    throw new Error("Could not load the movies file");
  }

  const data: MoviesResponseDTO = await response.json();
  return data.movies;
}
