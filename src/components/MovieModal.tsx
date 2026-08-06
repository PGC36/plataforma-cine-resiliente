"use client";

import { useEffect, type MouseEvent } from "react";
import type { Movie } from "@/entities/Movie";
import type { Review } from "@/entities/Review";
import { useLanguage } from "@/hooks/useLanguage";
import { calculateEntryDelay } from "@/lib/animations";

interface MovieModalProps {
  movie: Movie | null;
  reviews: Review[] | null;
  onClose: () => void;
}

/** ex src/core/modal.ts + the reviews panel built by main.ts (renderModalReviews). */
export function MovieModal({ movie, reviews, onClose }: MovieModalProps) {
  const { t, translateMovie } = useLanguage();

  useEffect(() => {
    if (!movie) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.classList.add("no-scroll");
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [movie, onClose]);

  const translated = movie ? translateMovie(movie) : null;
  const reviewsForMovie = movie && reviews ? reviews.filter((review) => review.movieId === movie.id) : [];

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div className={`modal-overlay${movie ? " active" : ""}`} onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button type="button" className="modal__close" aria-label={t("close")} onClick={onClose}>
          ✕
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="modal__image" src={translated?.image} alt={translated ? `Poster of ${translated.title}` : ""} />
        <div className="modal__category">{translated?.category ?? ""}</div>
        <h2 className="modal__title" id="modal-title">
          {translated?.title ?? ""}
        </h2>
        <p className="modal__description">{translated?.description ?? ""}</p>
        <ul className="modal__details">
          <li>
            <strong>{t("year")}</strong> <span>{translated?.year ?? ""}</span>
          </li>
          <li>
            <strong>{t("director")}</strong> <span>{translated?.director ?? ""}</span>
          </li>
          <li>
            <strong>{t("duration")}</strong> <span>{translated?.duration ?? ""}</span> <span>{t("min")}</span>
          </li>
          <li>
            <strong>{t("rating")}</strong> ⭐ <span>{translated?.rating ?? ""}</span>
          </li>
        </ul>
      </div>

      <aside className={`modal-reviews${reviewsForMovie.length === 0 ? " hidden" : ""}`} aria-live="polite">
        {reviewsForMovie.map((review, index) => (
          <article
            key={`${review.movieId}-${index}`}
            className="modal-reviews__item"
            style={{ animationDelay: calculateEntryDelay(index) }}
          >
            <p className="modal-reviews__comment">&quot;{review.comment}&quot;</p>
            <p className="modal-reviews__author">
              — {review.author} · ⭐ {review.rating}
            </p>
          </article>
        ))}
      </aside>
    </div>
  );
}
