import { mapReviewsDtoToEntities } from "../mappers/reviewMapper.js";
import type { Review } from "../entities/Review.js";
import type { ReviewDTO } from "../dtos/Review.DTO.js";
import type { ReviewsResponseDTO } from "../dtos/ReviewsResponse.DTO.js";

const PROBABILITY_OF_FAILURE = 0;
const DELAY_MS = 700;

const params = new URLSearchParams(window.location.search);

function shouldForceFail(): boolean {
  const value = params.get("forceFail");
  return value === "reviews" || value === "all";
}

async function loadReviewsFromJSON(): Promise<ReviewDTO[]> {
  const response = await fetch("reviews.json");

  if (!response.ok) {
    throw new Error("Could not load the reviews file");
  }

  const data: ReviewsResponseDTO = await response.json();
  return data.reviews;
}

export function getReviews(): Promise<Review[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldForceFail() || Math.random() < PROBABILITY_OF_FAILURE) {
        reject(new Error("Reviews service unavailable"));
        return;
      }
      loadReviewsFromJSON().then((dtos) => resolve(mapReviewsDtoToEntities(dtos)), reject);
    }, DELAY_MS);
  });
}
