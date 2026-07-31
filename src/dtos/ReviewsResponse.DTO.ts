import type { ReviewDTO } from "./Review.DTO.js";

/** Raw envelope from the reviews endpoint (reviews.json). */
export interface ReviewsResponseDTO {
  reviews: ReviewDTO[];
}
