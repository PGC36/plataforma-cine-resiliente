import { isFavorite } from "./favorites.js";
import { getTranslation, translateMovie } from "./language.js";
import { calculateEntryDelay } from "./animations.js";
import type { Movie } from "../entities/Movie.js";

function createCard(originalMovie: Movie, index: number): HTMLElement {
  const movie = translateMovie(originalMovie);
  const article = document.createElement("article");
  article.className = "card";
  article.style.animationDelay = calculateEntryDelay(index);
  article.dataset.id = String(movie.id);
  article.dataset.title = movie.title;
  article.dataset.year = String(movie.year);
  article.dataset.director = movie.director;
  article.dataset.category = movie.category;
  article.dataset.duration = String(movie.duration);
  article.dataset.rating = String(movie.rating);
  article.dataset.description = movie.description;
  article.dataset.image = movie.image;

  const activeClass = isFavorite(movie.id) ? "active" : "";

  article.innerHTML = `
    <button class="card__favorite ${activeClass}" aria-label="${getTranslation("favorite")}">♥</button>
    <img class="card__image" src="${movie.image}" alt="Poster of ${movie.title}" loading="lazy" />
    <div class="card__category">${movie.category}</div>
    <h2 class="card__title">${movie.title}</h2>
    <p class="card__info"><span>${movie.year}</span> · <span>${movie.director}</span></p>
    <p class="card__info">${movie.duration} ${getTranslation("min")} · ⭐ ${movie.rating}</p>
  `;

  return article;
}

export function renderMovies(movies: Movie[], container: HTMLElement): void {
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  movies.forEach((movie, index) => fragment.appendChild(createCard(movie, index)));
  container.appendChild(fragment);
}
