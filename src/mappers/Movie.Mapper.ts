import type { Movie } from "../entities/Movie.js";
import type { MovieDTO } from "../dtos/Movie.DTO.js";

/**
 * Sanitizes a raw MovieDTO before it reaches the UI: if an *En field is
 * missing (see AGENTS.md), falls back to the default-language value instead
 * of showing "undefined".
 */
export function mapMovieDtoToEntity(dto: MovieDTO): Movie {
  return {
    id: dto.id,
    title: dto.title,
    titleEn: dto.titleEn ?? dto.title,
    year: dto.year,
    director: dto.director,
    category: dto.category,
    categoryEn: dto.categoryEn ?? dto.category,
    duration: dto.duration,
    rating: dto.rating,
    description: dto.description,
    descriptionEn: dto.descriptionEn ?? dto.description,
    image: dto.image,
  };
}

export function mapMoviesDtoToEntities(dtos: MovieDTO[]): Movie[] {
  return dtos.map(mapMovieDtoToEntity);
}
