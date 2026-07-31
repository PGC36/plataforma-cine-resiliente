import { obtenerPeliculas } from "../core/data.js";
import { mapPeliculasDtoToEntities } from "../mappers/movieMapper.js";
import type { Pelicula } from "../entities/Movie.js";

export async function obtenerCatalogo(): Promise<Pelicula[]> {
  const dtos = await obtenerPeliculas();
  return mapPeliculasDtoToEntities(dtos);
}
