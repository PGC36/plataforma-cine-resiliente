"use client";

import type { ChangeEvent } from "react";
import { useLanguage } from "@/hooks/useLanguage";

interface SearchBarProps {
  searchText: string;
  onSearchTextChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  disabled: boolean;
}

export function SearchBar({
  searchText,
  onSearchTextChange,
  category,
  onCategoryChange,
  categories,
  disabled,
}: SearchBarProps) {
  const { t } = useLanguage();

  return (
    <div className="search-bar">
      <input
        type="text"
        className="filters__input"
        placeholder={t("search")}
        value={searchText}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchTextChange(event.target.value)}
      />
      <select
        className="filters__select"
        value={category}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onCategoryChange(event.target.value)}
      >
        <option value="all">{t("all")}</option>
        {categories.map((categoryOption) => (
          <option key={categoryOption} value={categoryOption}>
            {categoryOption}
          </option>
        ))}
      </select>
    </div>
  );
}
