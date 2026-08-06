"use client";

import { useState, type MouseEvent } from "react";
import type { Movie } from "@/entities/Movie";
import { useLanguage } from "@/hooks/useLanguage";
import { calculateEntryDelay } from "@/lib/animations";

interface MovieCardProps {
  movie: Movie;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onSelect: () => void;
}

/** ex src/core/render.ts createCard(). */
export function MovieCard({ movie: originalMovie, index, isFavorite, onToggleFavorite, onSelect }: MovieCardProps) {
  const { t, translateMovie } = useLanguage();
  const [isPopping, setIsPopping] = useState(false);
  const movie = translateMovie(originalMovie);

  function handleFavoriteClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onToggleFavorite();
    setIsPopping(false);
    requestAnimationFrame(() => setIsPopping(true));
  }

  return (
    <article className="card" style={{ animationDelay: calculateEntryDelay(index) }} onClick={onSelect}>
      <button
        type="button"
        className={`card__favorite${isFavorite ? " active" : ""}${isPopping ? " animate" : ""}`}
        aria-label={t("favorite")}
        onClick={handleFavoriteClick}
        onAnimationEnd={() => setIsPopping(false)}
      >
        ♥
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="card__image" src={movie.image} alt={`Poster of ${movie.title}`} loading="lazy" />
      <div className="card__category">{movie.category}</div>
      <h2 className="card__title">{movie.title}</h2>
      <p className="card__info">
        <span>{movie.year}</span> · <span>{movie.director}</span>
      </p>
      <p className="card__info">
        {movie.duration} {t("min")} · ⭐ {movie.rating}
      </p>
    </article>
  );
}
