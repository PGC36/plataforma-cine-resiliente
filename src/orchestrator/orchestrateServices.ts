import { getCatalog } from "../services/catalogService.js";
import { getReviews } from "../services/reviewsService.js";
import { getAdvertisements } from "../services/advertisementsService.js";
import type { Movie } from "../entities/Movie.js";
import type { Review } from "../entities/Review.js";
import type { Advertisement } from "../entities/Advertisement.js";

export interface OrchestrationResult {
  movies: Movie[];
  reviews: Review[] | null;
  advertisements: Advertisement[] | null;
}

export async function orchestrateServices(): Promise<OrchestrationResult> {
  const [catalogResult, reviewsResult, advertisementsResult] = await Promise.allSettled([
    getCatalog(),
    getReviews(),
    getAdvertisements(),
  ]);

  if (catalogResult.status === "rejected") {
    throw catalogResult.reason;
  }

  if (reviewsResult.status === "rejected") {
    console.warn("Reviews unavailable:", reviewsResult.reason);
  }

  if (advertisementsResult.status === "rejected") {
    console.warn("Advertisements unavailable:", advertisementsResult.reason);
  }

  return {
    movies: catalogResult.value,
    reviews: reviewsResult.status === "fulfilled" ? reviewsResult.value : null,
    advertisements: advertisementsResult.status === "fulfilled" ? advertisementsResult.value : null,
  };
}
