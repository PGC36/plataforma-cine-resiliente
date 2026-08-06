import type { Review } from "../entities/Review";
import type { ReviewDTO } from "../dtos/Review.DTO";

export function mapReviewDtoToEntity(dto: ReviewDTO): Review {
  return {
    movieId: dto.movieId,
    author: dto.author,
    comment: dto.comment,
    rating: dto.rating,
  };
}

export function mapReviewsDtoToEntities(dtos: ReviewDTO[]): Review[] {
  return dtos.map(mapReviewDtoToEntity);
}
