import type { PeliculaDTO } from "./Movie.DTO.js";

/** Envelope crudo del endpoint de catálogo (peliculas.json). */
export interface PeliculasResponseDTO {
  peliculas: PeliculaDTO[];
}
