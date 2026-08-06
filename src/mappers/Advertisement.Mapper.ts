import type { Advertisement } from "../entities/Advertisement";
import type { AdvertisementDTO } from "../dtos/Advertisement.DTO";

export function mapAdvertisementDtoToEntity(dto: AdvertisementDTO): Advertisement {
  return {
    title: dto.title,
    text: dto.text,
    backgroundImage: dto.backgroundImage,
    ctaText: dto.ctaText,
  };
}

export function mapAdvertisementsDtoToEntities(dtos: AdvertisementDTO[]): Advertisement[] {
  return dtos.map(mapAdvertisementDtoToEntity);
}
