import { getMovies } from "../core/data.js";
import { mapMoviesDtoToEntities } from "../mappers/Movie.Mapper.js";
import type { Movie } from "../entities/Movie.js";

export async function getCatalog(): Promise<Movie[]> {
  const dtos = await getMovies();
  return mapMoviesDtoToEntities(dtos);
}
