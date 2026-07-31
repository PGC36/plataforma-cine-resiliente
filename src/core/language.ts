import type { Movie } from "../entities/Movie.js";

type Language = "es" | "en";

interface Translation {
  search: string;
  all: string;
  favorite: string;
  close: string;
  year: string;
  director: string;
  duration: string;
  rating: string;
  min: string;
  footer: string;
  error: string;
}

type TranslationKey = keyof Translation;

const STORAGE_KEY = "preferred-language";

const translations: Record<Language, Translation> = {
  es: {
    search: "Buscar película...",
    all: "Todas las categorías",
    favorite: "Agregar a favoritos",
    close: "Cerrar",
    year: "Año:",
    director: "Director:",
    duration: "Duración:",
    rating: "Calificación:",
    min: "min",
    footer: "Catálogo de películas — CapyFilms",
    error: "No se pudieron cargar las películas.",
  },
  en: {
    search: "Search movie...",
    all: "All categories",
    favorite: "Add to favorites",
    close: "Close",
    year: "Year:",
    director: "Director:",
    duration: "Duration:",
    rating: "Rating:",
    min: "min",
    footer: "Movie catalog — CapyFilms",
    error: "Movies could not be loaded.",
  },
};

export function getLanguage(): Language {
  return (localStorage.getItem(STORAGE_KEY) as Language | null) || "es";
}

export function getTranslation(key: TranslationKey): string {
  const language = getLanguage();
  return translations[language][key];
}

export function setLanguage(language: Language): void {
  localStorage.setItem(STORAGE_KEY, language);
}

export function translateMovie(movie: Movie): Movie {
  if (getLanguage() === "en") {
    return {
      ...movie,
      title: movie.titleEn,
      category: movie.categoryEn,
      description: movie.descriptionEn,
    };
  }
  return movie;
}

export function applyLanguage(): void {
  const language = getLanguage();
  const dictionary = translations[language];

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n as TranslationKey;
    element.textContent = dictionary[key];
  });

  document.querySelectorAll<HTMLElement>("[data-i18n-placeholder]").forEach((element) => {
    if (element instanceof HTMLInputElement) {
      const key = element.dataset.i18nPlaceholder as TranslationKey;
      element.placeholder = dictionary[key];
    }
  });

  document.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach((element) => {
    const key = element.dataset.i18nAria as TranslationKey;
    element.setAttribute("aria-label", dictionary[key]);
  });

  document.documentElement.lang = language;

  const languageButton = document.getElementById("language-button");
  if (languageButton) {
    languageButton.textContent = language === "es" ? "EN" : "ES";
  }
}
