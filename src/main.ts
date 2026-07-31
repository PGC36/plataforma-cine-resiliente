import { renderMovies } from "./core/render.js";
import { openModal, initializeModal } from "./core/modal.js";
import { toggleFavorite, updateFavoritesCounter } from "./core/favorites.js";
import { populateCategories, filterMovies } from "./core/filters.js";
import { getLanguage, setLanguage, applyLanguage, getTranslation } from "./core/language.js";
import { animateFavorite, calculateEntryDelay } from "./core/animations.js";
import { getElement } from "./core/dom.js";
import { orchestrateServices } from "./orchestrator/orchestrateServices.js";
import { createMovieFilter } from "./cache/filterCache.js";
import type { MovieFilter } from "./cache/filterCache.js";
import type { Movie } from "./entities/Movie.js";
import type { Review } from "./entities/Review.js";
import type { Advertisement } from "./entities/Advertisement.js";

const container = getElement("movies-container");
const searchInput = getElement<HTMLInputElement>("search-input");
const categoryFilter = getElement<HTMLSelectElement>("category-filter");
const languageButton = getElement("language-button");
const adsSection = getElement("ads-section");
const adsSlide = getElement("ads-slide");
const adsPrev = getElement("ads-prev");
const adsNext = getElement("ads-next");
const adsDots = getElement("ads-dots");
const modalReviews = getElement("modal-reviews");

const AUTOPLAY_INTERVAL_MS = 6000;

let movies: Movie[] = [];
let movieFilter: MovieFilter | null = null;
let reviews: Review[] | null = null;
let advertisements: Advertisement[] = [];
let currentAdIndex = 0;
let adsAutoplayTimer: number | undefined;
let searchTimer: number | undefined;

function applyFiltersWithDelay(): void {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 300);
}

function handleContainerClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const card = target.closest<HTMLElement>(".card");
  if (!card) return;

  const favoriteButton = target.closest<HTMLElement>(".card__favorite");

  if (favoriteButton) {
    const isFavoriteNow = toggleFavorite(Number(card.dataset.id));
    favoriteButton.classList.toggle("active", isFavoriteNow);
    updateFavoritesCounter();
    animateFavorite(favoriteButton);
    return;
  }

  openModal(card.dataset);
  renderModalReviews(Number(card.dataset.id));
}

async function applyFilters(): Promise<void> {
  if (!movieFilter) return;

  categoryFilter.disabled = true;
  try {
    const moviesInGenre = await movieFilter.filterByGenre(categoryFilter.value);
    const filteredMovies = filterMovies(moviesInGenre, searchInput.value, "all");
    renderMovies(filteredMovies, container);
  } finally {
    categoryFilter.disabled = false;
  }
}

function handleLanguageChange(): void {
  const newLanguage = getLanguage() === "es" ? "en" : "es";
  setLanguage(newLanguage);
  applyLanguage();
  categoryFilter.value = "all";
  populateCategories(movies, categoryFilter);
  applyFilters();
}

function paintCurrentAdSlide(): void {
  const ad = advertisements[currentAdIndex];
  if (!ad) return;

  adsSlide.style.backgroundImage = `linear-gradient(90deg, rgba(20,20,28,0.92), rgba(20,20,28,0.35)), url("${ad.backgroundImage}")`;
  adsSlide.innerHTML = `
    <div class="ads__content">
      <h3 class="ads__title">${ad.title}</h3>
      <p class="ads__text">${ad.text}</p>
      <button type="button" class="ads__cta">${ad.ctaText}</button>
    </div>
  `;

  adsDots.querySelectorAll(".ads__dot").forEach((dot, index) => {
    dot.classList.toggle("active", index === currentAdIndex);
  });
}

function restartAdsAutoplay(): void {
  clearInterval(adsAutoplayTimer);
  if (advertisements.length > 1) {
    adsAutoplayTimer = setInterval(() => goToAd(currentAdIndex + 1), AUTOPLAY_INTERVAL_MS);
  }
}

function goToAd(index: number): void {
  currentAdIndex = (index + advertisements.length) % advertisements.length;
  paintCurrentAdSlide();
  restartAdsAutoplay();
}

function renderAds(data: Advertisement[] | null): void {
  if (!data || data.length === 0) return;

  advertisements = data;
  currentAdIndex = 0;

  adsDots.innerHTML = advertisements
    .map((_, index) => `<button type="button" class="ads__dot" data-index="${index}" aria-label="Go to ad ${index + 1}"></button>`)
    .join("");

  adsSection.classList.toggle("ads--single", advertisements.length <= 1);
  paintCurrentAdSlide();
  restartAdsAutoplay();
  adsSection.classList.remove("hidden");
}

function renderModalReviews(movieId: number): void {
  modalReviews.classList.add("hidden");
  modalReviews.innerHTML = "";

  if (!reviews) return;

  const reviewsForMovie = reviews.filter((review) => review.movieId === movieId);
  if (reviewsForMovie.length === 0) return;

  modalReviews.innerHTML = reviewsForMovie
    .map(
      (review, index) => `
        <article class="modal-reviews__item" style="animation-delay: ${calculateEntryDelay(index)}">
          <p class="modal-reviews__comment">"${review.comment}"</p>
          <p class="modal-reviews__author">— ${review.author} · ⭐ ${review.rating}</p>
        </article>
      `
    )
    .join("");
  modalReviews.classList.remove("hidden");
}

async function start(): Promise<void> {
  applyLanguage();
  initializeModal();
  updateFavoritesCounter();
  container.addEventListener("click", handleContainerClick);
  searchInput.addEventListener("input", applyFiltersWithDelay);
  categoryFilter.addEventListener("change", applyFilters);
  languageButton.addEventListener("click", handleLanguageChange);
  adsPrev.addEventListener("click", () => goToAd(currentAdIndex - 1));
  adsNext.addEventListener("click", () => goToAd(currentAdIndex + 1));
  adsDots.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const dot = target.closest<HTMLElement>(".ads__dot");
    if (dot) goToAd(Number(dot.dataset.index));
  });

  try {
    const result = await orchestrateServices();
    movies = result.movies;
    reviews = result.reviews;
    movieFilter = createMovieFilter(movies);

    populateCategories(movies, categoryFilter);
    renderMovies(movies, container);

    renderAds(result.advertisements);
  } catch (error) {
    container.innerHTML = `<p>${getTranslation("error")}</p>`;
    console.error(error);
  }
}

start();
