import { translateMovie } from "./language.js";
import type { Movie } from "../entities/Movie.js";

export function populateCategories(movies: Movie[], selectElement: HTMLSelectElement): void {
  selectElement
    .querySelectorAll("option:not([value='all'])")
    .forEach((option) => option.remove());

  const categories = [
    ...new Set(movies.map((movie) => translateMovie(movie).category)),
  ].sort();

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    selectElement.appendChild(option);
  });
}

export function filterMovies(movies: Movie[], text: string, category: string): Movie[] {
  const normalizedText = text.trim().toLowerCase();

  return movies.filter((originalMovie) => {
    const movie = translateMovie(originalMovie);
    const matchesText = movie.title.toLowerCase().includes(normalizedText);
    const matchesCategory = category === "all" || movie.category === category;
    return matchesText && matchesCategory;
  });
}
