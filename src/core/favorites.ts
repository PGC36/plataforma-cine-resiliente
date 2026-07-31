const STORAGE_KEY = "favorite-movies";

function loadFavorites(): Set<number> {
  const saved = localStorage.getItem(STORAGE_KEY);
  return new Set(saved ? (JSON.parse(saved) as number[]) : []);
}

const favorites = loadFavorites();

function saveFavorites(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
}

export function isFavorite(id: number): boolean {
  return favorites.has(id);
}

export function toggleFavorite(id: number): boolean {
  if (favorites.has(id)) {
    favorites.delete(id);
  } else {
    favorites.add(id);
  }
  saveFavorites();
  return favorites.has(id);
}

export function countFavorites(): number {
  return favorites.size;
}

export function updateFavoritesCounter(): void {
  const counterElement = document.getElementById("favorites-counter-number");
  if (counterElement) {
    counterElement.textContent = String(countFavorites());
  }
}
