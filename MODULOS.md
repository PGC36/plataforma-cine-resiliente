# Módulos, hooks y componentes

Detalle de cada archivo del proyecto: responsabilidad, qué expone (`export`) y de qué depende (`import`). Para el flujo completo entre piezas y las convenciones generales, ver [AGENTS.md](./AGENTS.md). Para el historial de las dos migraciones (JS vanilla → TypeScript, y TypeScript vanilla → React + Next.js), ver [MIGRACION-TYPESCRIPT.md](./MIGRACION-TYPESCRIPT.md) y [MIGRACION-REACT-NEXTJS.md](./MIGRACION-REACT-NEXTJS.md).

## `src/entities/` — modelo de dominio

Interfaces puras, sin lógica. Sin cambios respecto a la versión TypeScript vanilla.

### `Movie.ts`
- **Exports:** `interface Movie { id, title, titleEn, year, director, category, categoryEn, duration, rating, description, descriptionEn, image }`.

### `Review.ts`
- **Exports:** `interface Review { movieId, author, comment, rating }`.

### `Advertisement.ts`
- **Exports:** `interface Advertisement { title, text, backgroundImage, ctaText }`.

---

## `src/dtos/` — forma cruda de cada endpoint

Sin cambios de fondo (solo los imports internos perdieron la extensión `.js`, ya no hace falta con la resolución de módulos de Next).

### `Movie.DTO.ts` / `MoviesResponse.DTO.ts`
- **Exports:** `interface MovieDTO`, `interface MoviesResponseDTO { movies: MovieDTO[] }`.

### `Review.DTO.ts` / `ReviewsResponse.DTO.ts`
- **Exports:** `interface ReviewDTO`, `interface ReviewsResponseDTO { reviews: ReviewDTO[] }`.

### `Advertisement.DTO.ts`
- **Exports:** `interface AdvertisementDTO`.

---

## `src/mappers/` — funciones puras DTO → Entity

Sin cambios de lógica. Se llaman desde `services/`.

### `Movie.Mapper.ts`
- **Exports:** `mapMovieDtoToEntity(dto): Movie`, `mapMoviesDtoToEntities(dtos): Movie[]`. Cae a los valores en español si faltan los campos `*En` del DTO.

### `Review.Mapper.ts`
- **Exports:** `mapReviewDtoToEntity(dto): Review`, `mapReviewsDtoToEntities(dtos): Review[]`.

### `Advertisement.Mapper.ts`
- **Exports:** `mapAdvertisementDtoToEntity(dto): Advertisement`, `mapAdvertisementsDtoToEntities(dtos): Advertisement[]`.

---

## `src/services/` — tres "backends" simulados

Cada uno hace: obtener datos crudos → mapear DTO→Entity → resolver/rechazar con `Entity[]`. Consumidos desde `src/hooks/`, no hay orquestador central (ver AGENTS.md).

### `Catalog.Service.ts`
- **Responsabilidad:** `fetch("/movies.json")` + `Movie.Mapper.ts`. Nunca falla a propósito. Antes vivía repartido entre `core/data.ts` (fetch) y `services/Catalog.Service.ts` (mapeo); ahora está todo en un solo archivo, ya que `core/` no existe más.
- **Exports:** `getCatalog(): Promise<Movie[]>`.

### `Reviews.Service.ts`
- **Responsabilidad:** simular un servicio externo de reseñas, con fallo aleatorio o forzado.
- **Exports:** `getReviews(): Promise<Review[]>`.
- **Parámetros de simulación:** `DELAY_MS = 700`, `PROBABILITY_OF_FAILURE = 0`.
- **Detalle importante:** `shouldForceFail()` construye `new URLSearchParams(window.location.search)` **dentro de la función**, no a nivel de módulo — el módulo se evalúa también durante el prerender de Next en el servidor (donde `window` no existe), así que leer `window` a nivel de módulo rompe el build.
- **Fuente de datos (`public/reviews.json`):** sin cambios, 187 reseñas repartidas sobre las 30 películas.

### `Advertisements.Service.ts`
- **Responsabilidad:** simular el servicio de anuncios promocionales, mismo patrón que reviews pero independiente.
- **Exports:** `getAdvertisements(): Promise<Advertisement[]>`.
- **Parámetros de simulación:** `DELAY_MS = 500`, `PROBABILITY_OF_FAILURE = 0`.
- **Mock:** 3 anuncios con imagen en `public/banners/` — mismas rutas que antes, con `/` inicial (`/banners/SemanaCineClasico.webp`, etc.) porque ahora se sirven desde `public/`.

---

## `src/hooks/` — estado y efectos de React

### `useCatalog.ts`
- **Responsabilidad:** dispara `getCatalog()` en un `useEffect` al montar.
- **Exports:** `useCatalog(): { movies: Movie[], loading: boolean, error: Error | null }`.

### `useReviews.ts`
- **Responsabilidad:** dispara `getReviews()`. Si falla, no propaga el error — lo loguea con `console.warn` y devuelve `reviews: null` (no fatal, ver AGENTS.md).
- **Exports:** `useReviews(): { reviews: Review[] | null, loading: boolean }`.

### `useAdvertisements.ts`
- **Responsabilidad:** igual que `useReviews.ts` pero para `getAdvertisements()`; si falla devuelve `advertisements: []`.
- **Exports:** `useAdvertisements(): { advertisements: Advertisement[], loading: boolean }`.

### `useFavorites.ts`
- **Responsabilidad:** estado de favoritos en `localStorage` (clave `favorite-movies`). El estado real vive en un `useState<Set<number>>`; se hidrata desde `localStorage` en un `useEffect` al montar (no se puede leer `localStorage` durante el render en el servidor).
- **Exports:** `useFavorites(): { isFavorite(id), toggleFavorite(id): boolean, count: number }`.
- **Nota:** `toggleFavorite` calcula el nuevo valor a partir del estado ya conocido en el cuerpo del hook (no de un *updater* de `setState`), para poder devolver el booleano `willBeFavorite` de forma síncrona, como hacía la versión vanilla.

### `useLanguage.tsx`
- **Responsabilidad:** diccionario ES/EN + traducción de datos, expuesto como Context (`LanguageProvider`) porque lo consumen muchos componentes (`Header`, `SearchBar`, `MovieCard`, `MovieModal`, `Footer`). Arranca en `"es"` y sincroniza la preferencia guardada en `localStorage` (`preferred-language`) en un `useEffect` al montar, por la misma razón que `useFavorites.ts`.
- **Exports:** `LanguageProvider` (envuelve `app/layout.tsx`), `useLanguage(): { language, t(key), toggleLanguage(), translateMovie(movie) }`.
- **Nota:** las **claves** del diccionario están en inglés; los **valores** de cada idioma se mantienen en español/inglés como contenido real de la UI — igual que `core/language.ts` en la versión vanilla.

### `useGenreFilter.ts`
- **Responsabilidad:** ex `cache/Filter.Cache.ts`. Filtra películas por género con un caché privado (`useRef<Map>`), para no repetir la simulación de latencia en géneros ya consultados.
- **Exports:** `useGenreFilter(movies: Movie[]): { filterByGenre(genre): Promise<Movie[]> }`.
- **Parámetros de simulación:** `DELAY_MS = 500`.
- **Detalles clave:**
  - El caché se indexa por **categoría canónica** (`movie.category`), no por el texto del `<select>` — igual que antes, vía un mapa `category`/`categoryEn` → clave canónica construido con `useMemo`.
  - El `Map` del caché se **resetea en un `useEffect`** cuando `movies` cambia de identidad (solo pasa una vez, cuando el catálogo termina de cargar) — no se resetea durante el render, porque las reglas de `react-hooks/refs` de este proyecto no permiten mutar un ref en el cuerpo del componente (ver AGENTS.md).
  - `"all"` devuelve el array completo sin tocar el caché.
  - La promesa se guarda en el caché **antes** de esperarla, así dos llamadas simultáneas al mismo género comparten la misma promesa.

### `useDebouncedValue.ts`
- **Responsabilidad:** debounce genérico (`useEffect` + `setTimeout`), usado por `CatalogPage` para el buscador (300ms) — reemplaza el `applyFiltersWithDelay`/`searchTimer` que vivía suelto en `main.ts`.
- **Exports:** `useDebouncedValue<T>(value: T, delayMs: number): T`.

---

## `src/lib/` — utilidades puras

### `animations.ts`
- **Responsabilidad:** igual que `core/animations.ts`, menos `animateFavorite` (que ahora es un patrón de estado local dentro de `MovieCard.tsx`, ver más abajo).
- **Exports:** `calculateEntryDelay(index): string`.

### `filterMovies.ts`
- **Responsabilidad:** ex `core/filters.ts` `filterMovies()`, sin el parámetro de categoría (el género ya lo resuelve `useGenreFilter`, así que siempre se filtra solo por texto). Traduce cada película para comparar contra el título mostrado, pero devuelve los objetos originales sin traducir — igual que antes, para que quien renderice pueda traducir de nuevo sin duplicar lógica de idioma en dos lugares.
- **Exports:** `filterMoviesByText(movies, text, translateMovie): Movie[]`.

---

## `src/components/`

### `CatalogPage.tsx`
- **Responsabilidad:** único componente con estado real de la página. Llama a todos los hooks de arriba, arma `visibleMovies` (género + texto) en un `useEffect` envuelto en `useTransition`, y renderiza el resto de los componentes en el mismo orden que tenía `index.html` (`Header` → `AdsCarousel` → `SearchBar` → `MovieGrid` → `Footer` → `MovieModal`).
- **Detalle:** el reset de `category` a `"all"` cuando cambia `language` se hace **durante el render** (comparando contra un `useState` que guarda el último `language` visto), no en un `useEffect` — patrón "adjusting state when a prop changes" de React, exigido por las reglas de lint de este proyecto (ver AGENTS.md).
- **No exporta nada más** que el componente.

### `Header.tsx`
- **Responsabilidad:** logo + título, contador de favoritos, botón de idioma.
- **Props:** `{ favoritesCount: number }`. Lee `language`/`toggleLanguage` de `useLanguage()` directamente.

### `AdsCarousel.tsx`
- **Responsabilidad:** ex carrusel de anuncios de `main.ts` (`renderAds`/`paintCurrentAdSlide`/`goToAd`/`restartAdsAutoplay`).
- **Props:** `{ advertisements: Advertisement[] }`. Si `advertisements.length === 0`, devuelve `null` (no se monta — no necesita la clase `.hidden`, a diferencia del modal).
- **Detalle:** el autoplay (`setInterval` cada 6s) se reinicia solo porque el `useEffect` que lo arma depende de `currentIndex` — cualquier navegación, manual o automática, dispara el mismo `setCurrentIndex`, así que el efecto se limpia y se vuelve a armar sin necesitar una función `restartAdsAutoplay` separada.

### `SearchBar.tsx`
- **Responsabilidad:** input de búsqueda + `<select>` de categoría (controlados, `value`/`onChange`).
- **Props:** `{ searchText, onSearchTextChange, category, onCategoryChange, categories, disabled }`. `categories` lo calcula `CatalogPage` con `useMemo` a partir de `movies` traducidas (reemplaza `populateCategories()` de `core/filters.ts`).

### `MovieGrid.tsx`
- **Responsabilidad:** el `<main class="container">` que antes llenaba `render.ts`. Mapea `movies` a `MovieCard`.
- **Props:** `{ movies, isFavorite, onToggleFavorite, onSelectMovie }`.

### `MovieCard.tsx`
- **Responsabilidad:** ex `createCard()` de `core/render.ts`. Traduce la película que recibe (vía `useLanguage().translateMovie`) para mostrarla.
- **Props:** `{ movie, index, isFavorite, onToggleFavorite, onSelect }`.
- **Detalle:** el pop del botón de favoritos (`.card__favorite.animate`) se retriggerea con un estado local `isPopping` + `requestAnimationFrame` (para forzar un frame con la clase sacada antes de volver a ponerla) en vez del `classList.remove/offsetWidth/classList.add` manual que hacía `animateFavorite()` en la versión vanilla.

### `MovieModal.tsx`
- **Responsabilidad:** ex `core/modal.ts` + el panel de reseñas que armaba `renderModalReviews()` en `main.ts`, todo en un solo componente.
- **Props:** `{ movie: Movie | null, reviews: Review[] | null, onClose }`.
- **Detalle:** se renderiza **siempre** (nunca condicionalmente), alternando la clase `.active` en `.modal-overlay` — necesario para que la transición CSS de entrada/salida siga funcionando (si se montara/desmontara con `{selectedMovie && <MovieModal />}`, aparecería ya en su estado final, sin nada de qué transicionar). El cierre con Esc se maneja con un listener de `keydown` en un `useEffect` que solo se agrega mientras `movie` no es `null`; el scroll del body se bloquea (`document.body.classList.add("no-scroll")`) con el mismo patrón.
- Filtra `reviews` por `movie.id` internamente (antes lo hacía `main.ts` con `renderModalReviews(movieId)`).

### `Footer.tsx`
- **Responsabilidad:** el `<footer>` con el texto traducido (`t("footer")`).
