"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useCatalog } from "@/hooks/useCatalog";
import { useReviews } from "@/hooks/useReviews";
import { useAdvertisements } from "@/hooks/useAdvertisements";
import { useFavorites } from "@/hooks/useFavorites";
import { useGenreFilter } from "@/hooks/useGenreFilter";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLanguage } from "@/hooks/useLanguage";
import { filterMoviesByText } from "@/lib/filterMovies";
import type { Movie } from "@/entities/Movie";
import { Header } from "./Header";
import { AdsCarousel } from "./AdsCarousel";
import { SearchBar } from "./SearchBar";
import { MovieGrid } from "./MovieGrid";
import { MovieModal } from "./MovieModal";
import { Footer } from "./Footer";

const SEARCH_DEBOUNCE_MS = 300;

export function CatalogPage() {
  const { movies, error: catalogError } = useCatalog();
  const { reviews } = useReviews();
  const { advertisements } = useAdvertisements();
  const { isFavorite, toggleFavorite, count: favoritesCount } = useFavorites();
  const { t, language, translateMovie } = useLanguage();
  const { filterByGenre } = useGenreFilter(movies);

  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);
  const [category, setCategory] = useState("all");
  const [visibleMovies, setVisibleMovies] = useState<Movie[]>([]);
  const [isFiltering, startFiltering] = useTransition();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // Language toggle repopulates categories with the new-language labels, so
  // the previously selected category (in the old language) no longer
  // applies — reset it during render, React's documented pattern for
  // "adjusting state when a dependency changes" (see react.dev).
  const [languageAtLastCategoryReset, setLanguageAtLastCategoryReset] = useState(language);
  if (language !== languageAtLastCategoryReset) {
    setLanguageAtLastCategoryReset(language);
    setCategory("all");
  }

  useEffect(() => {
    let cancelled = false;

    startFiltering(async () => {
      const moviesInGenre = await filterByGenre(category);
      if (!cancelled) {
        setVisibleMovies(filterMoviesByText(moviesInGenre, debouncedSearchText, translateMovie));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [category, debouncedSearchText, filterByGenre, translateMovie]);

  const categories = useMemo(() => {
    const unique = new Set(movies.map((movie) => translateMovie(movie).category));
    return [...unique].sort();
  }, [movies, translateMovie]);

  if (catalogError) {
    return (
      <>
        <Header favoritesCount={favoritesCount} />
        <main className="container">
          <p>{t("error")}</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header favoritesCount={favoritesCount} />
      <AdsCarousel advertisements={advertisements} />
      <SearchBar
        searchText={searchText}
        onSearchTextChange={setSearchText}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        disabled={isFiltering}
      />
      <MovieGrid
        movies={visibleMovies}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onSelectMovie={setSelectedMovie}
      />
      <Footer />
      <MovieModal movie={selectedMovie} reviews={reviews} onClose={() => setSelectedMovie(null)} />
    </>
  );
}
