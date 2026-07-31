import type { Resena } from "../entities/Review.js";
import type { ResenaDTO } from "../dtos/Review.DTO.js";

export function mapResenaDtoToEntity(dto: ResenaDTO): Resena {
  return {
    peliculaId: dto.peliculaId,
    autor: dto.autor,
    comentario: dto.comentario,
    puntuacion: dto.puntuacion,
  };
}

export function mapResenasDtoToEntities(dtos: ResenaDTO[]): Resena[] {
  return dtos.map(mapResenaDtoToEntity);
}
