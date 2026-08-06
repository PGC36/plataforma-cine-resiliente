"use client";

import { useLanguage } from "@/hooks/useLanguage";

interface HeaderProps {
  favoritesCount: number;
}

export function Header({ favoritesCount }: HeaderProps) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <header className="header">
      <div className="header__brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="Capy Films logo" className="header__logo" />
        <h1 className="header__title">
          <object
            data="/images/titleText.png"
            type="image/png"
            className="header__title-image"
            aria-label="Capy Films"
          >
            Capy Films
          </object>
        </h1>
      </div>
      <div className="header__filters">
        <div className="favorites-counter">
          <span className="favorites-counter__icon">♥</span>
          <span className="favorites-counter__number">{favoritesCount}</span>
        </div>
        <button
          type="button"
          className="filters__language-button"
          aria-label="Change language"
          onClick={toggleLanguage}
        >
          {language === "es" ? "EN" : "ES"}
        </button>
      </div>
    </header>
  );
}
