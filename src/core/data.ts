import type { PeliculaDTO } from "../dtos/Movie.DTO.js";
import type { PeliculasResponseDTO } from "../dtos/MoviesResponse.DTO.js";

export async function obtenerPeliculas(): Promise<PeliculaDTO[]> {
  const respuesta = await fetch("peliculas.json");

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar el archivo de películas");
  }

  const datos: PeliculasResponseDTO = await respuesta.json();
  return datos.peliculas;
}
