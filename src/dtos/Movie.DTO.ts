/**
 * Raw shape of each movie as it comes from movies.json,
 * before going through mappers/Movie.Mapper.ts.
 */
export interface MovieDTO {
  id: number;
  title: string;
  titleEn?: string;
  year: number;
  director: string;
  category: string;
  categoryEn?: string;
  duration: number;
  rating: number;
  description: string;
  descriptionEn?: string;
  image: string;
}
