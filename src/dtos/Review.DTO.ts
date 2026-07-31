/** Raw shape of each review as it comes from reviews.json. */
export interface ReviewDTO {
  movieId: number;
  author: string;
  comment: string;
  rating: number;
}
