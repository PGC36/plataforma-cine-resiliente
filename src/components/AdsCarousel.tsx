"use client";

import { useEffect, useState } from "react";
import type { Advertisement } from "@/entities/Advertisement";

const AUTOPLAY_INTERVAL_MS = 6000;

interface AdsCarouselProps {
  advertisements: Advertisement[];
}

/** ex ads carousel logic in src/main.ts (renderAds/paintCurrentAdSlide/goToAd/restartAdsAutoplay). */
export function AdsCarousel({ advertisements }: AdsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset the slide whenever the advertisements list changes identity (only
  // happens once, when the service resolves) — adjusted during render,
  // React's documented pattern for "adjusting state when a prop changes".
  const [advertisementsAtLastReset, setAdvertisementsAtLastReset] = useState(advertisements);
  if (advertisements !== advertisementsAtLastReset) {
    setAdvertisementsAtLastReset(advertisements);
    setCurrentIndex(0);
  }

  useEffect(() => {
    if (advertisements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % advertisements.length);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
    // currentIndex is a dependency on purpose: any navigation (manual or
    // autoplay) restarts the interval, same as restartAdsAutoplay() did.
  }, [advertisements, currentIndex]);

  if (advertisements.length === 0) return null;

  const currentAd = advertisements[currentIndex];
  if (!currentAd) return null;

  function goToIndex(index: number) {
    setCurrentIndex((index + advertisements.length) % advertisements.length);
  }

  return (
    <section className={`ads${advertisements.length <= 1 ? " ads--single" : ""}`} aria-live="polite">
      <button
        type="button"
        className="ads__arrow ads__arrow--left"
        aria-label="Previous ad"
        onClick={() => goToIndex(currentIndex - 1)}
      >
        ‹
      </button>
      <div
        className="ads__slide"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(20,20,28,0.92), rgba(20,20,28,0.35)), url("${currentAd.backgroundImage}")`,
        }}
      >
        <div className="ads__content">
          <h3 className="ads__title">{currentAd.title}</h3>
          <p className="ads__text">{currentAd.text}</p>
          <button type="button" className="ads__cta">
            {currentAd.ctaText}
          </button>
        </div>
      </div>
      <button
        type="button"
        className="ads__arrow ads__arrow--right"
        aria-label="Next ad"
        onClick={() => goToIndex(currentIndex + 1)}
      >
        ›
      </button>
      <div className="ads__dots">
        {advertisements.map((advertisement, index) => (
          <button
            key={advertisement.title}
            type="button"
            className={`ads__dot${index === currentIndex ? " active" : ""}`}
            aria-label={`Go to ad ${index + 1}`}
            onClick={() => goToIndex(index)}
          />
        ))}
      </div>
    </section>
  );
}
