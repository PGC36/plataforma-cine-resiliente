import type { Anuncio } from "../entities/Advertisement.js";
import type { AnuncioDTO } from "../dtos/Advertisement.DTO.js";

export function mapAnuncioDtoToEntity(dto: AnuncioDTO): Anuncio {
  return {
    titulo: dto.titulo,
    texto: dto.texto,
    imagenFondo: dto.imagenFondo,
    textoCta: dto.textoCta,
  };
}

export function mapAnunciosDtoToEntities(dtos: AnuncioDTO[]): Anuncio[] {
  return dtos.map(mapAnuncioDtoToEntity);
}
