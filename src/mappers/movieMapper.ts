import type { Pelicula } from "../entities/Movie.js";
import type { PeliculaDTO } from "../dtos/Movie.DTO.js";

/**
 * Sanea un PeliculaDTO crudo antes de que llegue a la UI: si falta un campo
 * *En (ver AGENTS.md), cae al valor en español en vez de mostrar "undefined".
 */
export function mapPeliculaDtoToEntity(dto: PeliculaDTO): Pelicula {
  return {
    id: dto.id,
    titulo: dto.titulo,
    tituloEn: dto.tituloEn ?? dto.titulo,
    anio: dto.anio,
    director: dto.director,
    categoria: dto.categoria,
    categoriaEn: dto.categoriaEn ?? dto.categoria,
    duracion: dto.duracion,
    calificacion: dto.calificacion,
    descripcion: dto.descripcion,
    descripcionEn: dto.descripcionEn ?? dto.descripcion,
    imagen: dto.imagen,
  };
}

export function mapPeliculasDtoToEntities(dtos: PeliculaDTO[]): Pelicula[] {
  return dtos.map(mapPeliculaDtoToEntity);
}
