import { mapMoviesDtoToEntities } from "../mappers/Movie.Mapper";
import type { Movie } from "../entities/Movie";
import type { MovieDTO } from "../dtos/Movie.DTO";
import type { MoviesResponseDTO } from "../dtos/MoviesResponse.DTO";

async function loadMoviesFromJSON(): Promise<MovieDTO[]> {
  const response = await fetch("/movies.json");

  if (!response.ok) {
    throw new Error("Could not load the movies file");
  }

  const data: MoviesResponseDTO = await response.json();
  return data.movies;
}

export async function getCatalog(): Promise<Movie[]> {
  const dtos = await loadMoviesFromJSON();
  return mapMoviesDtoToEntities(dtos);
}
