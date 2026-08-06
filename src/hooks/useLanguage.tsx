"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Movie } from "@/entities/Movie";

export type Language = "es" | "en";

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

export type TranslationKey = keyof Translation;

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

interface LanguageContextValue {
  language: Language;
  t: (key: TranslationKey) => string;
  toggleLanguage: () => void;
  translateMovie: (movie: Movie) => Movie;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es");

  useEffect(() => {
    // localStorage isn't available during SSR: hydrate with the default
    // "es" on first render, then sync the stored preference after mount.
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "es" || stored === "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => {
      const next: Language = current === "es" ? "en" : "es";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback((key: TranslationKey) => translations[language][key], [language]);

  const translateMovie = useCallback(
    (movie: Movie): Movie => {
      if (language === "en") {
        return {
          ...movie,
          title: movie.titleEn,
          category: movie.categoryEn,
          description: movie.descriptionEn,
        };
      }
      return movie;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage, translateMovie }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
