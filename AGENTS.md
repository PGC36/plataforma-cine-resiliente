# AGENTS.md

Guía para agentes de IA (y humanos) que trabajen en este proyecto: catálogo de películas en React + Next.js (App Router), TypeScript.

## Qué es esto

App de Next.js (`app/` + `src/`) que muestra un catálogo de películas leído desde `public/movies.json`. Incluye: grid responsivo, modal de detalle, favoritos persistidos, buscador + filtro de categoría, selector de idioma ES/EN, tres hooks de datos independientes (catálogo/reseñas/anuncios, cada uno simulando latencia y fallo por separado), un hook de filtrado por género con caché, y una arquitectura en capas (DTO → mapper → entity) que sanea los datos crudos antes de que lleguen a la UI.

Para el detalle archivo por archivo de cada módulo, hook y componente, ver [MODULOS.md](./MODULOS.md). Para el historial completo de las dos migraciones que tuvo el proyecto — JS vanilla → TypeScript, y TypeScript vanilla → React + Next.js —, ver [MIGRACION-TYPESCRIPT.md](./MIGRACION-TYPESCRIPT.md) y [MIGRACION-REACT-NEXTJS.md](./MIGRACION-REACT-NEXTJS.md).

## Cómo correrlo

```bash
npm install
npm run dev
# abrir http://localhost:3000
```

`npm run build` genera el build de producción, `npm run start` lo sirve, `npm run lint` corre ESLint con la config de Next (incluye reglas de `react-hooks` particularmente estrictas — ver "Convenciones" más abajo).

## Estructura de archivos

```
app/
  layout.tsx        Server Component: metadata (title "CapyFilms", favicon), envuelve
                     children en <LanguageProvider>, importa app/globals.css.
  page.tsx            "use client" (vía CatalogPage); renderiza <CatalogPage />.
  globals.css          Todo el CSS del proyecto (ex styles.css, movido tal cual).
public/
  movies.json          Fuente de datos. Igual formato que antes (30 películas, claves
                       en inglés, pares *En).
  reviews.json          Reseñas mock (187 items), fetched por Reviews.Service.ts.
  posters/, banners/, images/   Igual que antes, servidos desde la raíz del sitio.
src/
  entities/            Movie.ts, Review.ts, Advertisement.ts — modelo de dominio.
  dtos/                 Forma cruda de cada "endpoint" antes de mapear.
  mappers/              Funciones puras DTO → Entity.
  services/            Catalog.Service.ts, Reviews.Service.ts, Advertisements.Service.ts
                       — misma lógica que en la versión TypeScript vanilla (fetch +
                       delay simulado + fallo aleatorio/forzado), ahora consumidos
                       desde hooks en vez de un orquestador central.
  hooks/
    useCatalog.ts, useReviews.ts, useAdvertisements.ts   Un hook por servicio, cada
                       uno con su propio { data, loading, error }.
    useFavorites.ts     Favoritos en localStorage.
    useLanguage.tsx      Context + Provider ES/EN, localStorage, traduce datos y UI.
    useGenreFilter.ts    Filtrado por género con caché (ex cache/Filter.Cache.ts).
    useDebouncedValue.ts  Debounce genérico (buscador).
  lib/
    animations.ts        calculateEntryDelay (entrada escalonada de las cards/reseñas).
    filterMovies.ts        Filtro de texto sobre el título ya traducido.
  components/
    CatalogPage.tsx       Compone toda la página; dueño del estado de búsqueda,
                       categoría y película seleccionada; llama a todos los hooks.
    Header.tsx, AdsCarousel.tsx, SearchBar.tsx, MovieGrid.tsx, MovieCard.tsx,
    MovieModal.tsx, Footer.tsx
```

## Flujo (cómo se conectan las piezas)

```
CatalogPage (src/components/CatalogPage.tsx) — único punto de entrada real
  │
  ├─ useCatalog()          → { movies, error }        (Catalog.Service.ts, nunca falla)
  ├─ useReviews()           → { reviews }               (Reviews.Service.ts, puede fallar)
  ├─ useAdvertisements()    → { advertisements }         (Advertisements.Service.ts, puede fallar)
  ├─ useFavorites()         → { isFavorite, toggleFavorite, count }   (localStorage)
  ├─ useLanguage()          → { t, language, toggleLanguage, translateMovie }  (Context)
  ├─ useGenreFilter(movies) → { filterByGenre }          (caché por categoría canónica)
  └─ useDebouncedValue(searchText, 300)
  │
  ▼ render
  Header(favoritesCount)
  AdsCarousel(advertisements)   — no se monta si advertisements está vacío
  SearchBar(searchText, category, categories, disabled=isFiltering)
  MovieGrid(visibleMovies) → MovieCard × N
  Footer()
  MovieModal(selectedMovie, reviews)  — siempre montado; alterna .active por CSS
```

No hay un orquestador central (a diferencia de `orchestrateServices()` + `Promise.allSettled` en la versión TypeScript vanilla): cada servicio se dispara de forma independiente desde su propio hook. El catálogo sigue siendo el único obligatorio — si `useCatalog()` devuelve `error`, `CatalogPage` reemplaza todo el contenido por el mensaje de error traducido. Reseñas y anuncios siguen siendo opcionales: si fallan, el carrusel de anuncios no se monta y el panel de reseñas del modal queda oculto, sin afectar el resto de la app.

Filtrado (dentro de un `useEffect` de `CatalogPage`, envuelto en `useTransition` para no bloquear la UI mientras resuelve):

1. `filterByGenre(category)` — resuelve el género vía caché (instantáneo) o vía la simulación de latencia (primera vez que se consulta ese género).
2. El resultado se pasa a `filterMoviesByText(moviesInGenre, debouncedSearchText, translateMovie)`.
3. Se guarda en `visibleMovies`, que `MovieGrid` renderiza. `isFiltering` (el booleano que devuelve `useTransition`) deshabilita el `<select>` de categoría mientras tanto.

Eventos disparados por el usuario y su efecto:

| Evento | Hook/componente que reacciona | Efecto |
|---|---|---|
| tipear en el buscador | `useDebouncedValue` → efecto de filtrado en `CatalogPage` | re-renderiza `visibleMovies` (debounce de 300ms) |
| cambiar la categoría | `useGenreFilter` → efecto de filtrado en `CatalogPage` | ídem; deshabilita el `<select>` mientras resuelve |
| click en el botón de idioma | `useLanguage().toggleLanguage` | traduce textos y datos, resetea la categoría a "all", repuebla categorías |
| click en el corazón de una card | `useFavorites().toggleFavorite` (vía `MovieCard`) | toggle en localStorage + contador del header + animación de pop |
| click en una card (resto) | `CatalogPage.setSelectedMovie` | abre `MovieModal` con esa película y filtra `reviews` por `movieId` |
| cerrar (X / overlay / Esc) | `MovieModal` | `onClose` → `setSelectedMovie(null)` |

## Convenciones del proyecto

- **Idioma del código**: identificadores y comentarios en inglés; el **contenido** (títulos/descripciones de películas, reseñas, copy de los anuncios) se mantiene en español — sin cambios respecto a la versión TypeScript vanilla, ver [MIGRACION-TYPESCRIPT.md](./MIGRACION-TYPESCRIPT.md) §9.
- **Sin dependencias fuera de next/react/typescript + tooling de lint**: nada de librerías de estado, data-fetching o animación adicionales — el fetch simulado, la caché de género, el debounce y las animaciones se resuelven con hooks propios y el CSS existente.
- **Traducción de datos**: sin cambios, `movies.json` sigue guardando pares `*`/`*En`. Usar siempre `translateMovie()` (de `useLanguage()`), nunca leer `movie.title` directo en código que deba soportar ambos idiomas.
- **Favoritos / preferencia de idioma**: mismas claves de `localStorage` (`favorite-movies`, `preferred-language`). Se hidratan en un `useEffect` después del montaje — el primer render siempre muestra el estado por defecto (sin favoritos, español), porque `localStorage` no existe durante el render en el servidor.
- **Imágenes servidas desde `public/`**: pósters en `public/posters/`, banners en `public/banners/`, logo/título en `public/images/` — todo con rutas absolutas (`/posters/...`, `/movies.json`, etc.), no relativas.
- **Servicios simulados independientes entre sí**: sin cambios de lógica — `Catalog.Service.ts` nunca falla a propósito; `Reviews.Service.ts`/`Advertisements.Service.ts` tienen su propio `DELAY_MS`/`PROBABILITY_OF_FAILURE`.
- **Fallo forzado `?forceFail=reviews|advertisements|all`**: sin cambios de comportamiento, pero `shouldForceFail()` lee `window.location.search` **dentro** de la función que se llama, no a nivel de módulo — el módulo se evalúa también durante el prerender en el servidor, donde `window` no existe.
- **Caché de género por closure**: ahora vive en `hooks/useGenreFilter.ts` como un `useRef<Map>`, reseteado en un `useEffect` cuando cambia `movies` (nunca durante el render — ver la regla de refs más abajo). Sigue indexado por categoría canónica, no por el texto del `<select>`.
- **Reglas de React Hooks estrictas** (`react-hooks` v7, vía `eslint-config-next`): este proyecto corre con las reglas más nuevas del plugin, más exigentes que lo habitual. Si se agrega un efecto nuevo, correr `npm run lint`:
  - No llamar a `setState` de forma síncrona en el cuerpo de un efecto — si hace falta "cargar algo y marcar loading", el `setState` va dentro del `.then()`/`.catch()` del fetch, no antes (ver `useCatalog.ts`/`useReviews.ts`/`useAdvertisements.ts`).
  - No leer ni escribir `.current` de un ref durante el render — solo en efectos o handlers.
  - Para "resetear un estado cuando cambia otro valor" (ver `CatalogPage.tsx`: categoría al cambiar idioma; `AdsCarousel.tsx`: slide actual al cambiar `advertisements`), usar el patrón de React docs "adjusting state when a prop changes": guardar el valor anterior en un `useState` (no un ref) y comparar/ajustar durante el render.
  - La excepción marcada explícitamente: `useFavorites.ts`/`useLanguage.tsx` necesitan leer `localStorage` recién en un efecto (no existe durante SSR) y hacen `setState` ahí mismo — está señalado con `// eslint-disable-next-line react-hooks/set-state-in-effect` y un comentario explicando por qué.
- **El modal siempre está montado**: `MovieModal` se renderiza siempre (`movie: Movie | null`), alternando la clase `.active` — igual que hacía `index.html` originalmente — para no perder la transición CSS de entrada/salida (si se desmontara condicionalmente, el fade-in no tendría un estado "antes" del que animar).
- **El carrusel de anuncios sí se desmonta condicionalmente**: a diferencia del modal, si `advertisements.length === 0` (todavía cargando, o el servicio falló) `AdsCarousel` devuelve `null` directamente — no tiene una transición de entrada que preservar, así que no hace falta la clase `.hidden` para él.
- **`.hidden` sigue usando `!important` a propósito**, pero ahora solo la usa el panel de reseñas del modal (`.modal-reviews` en `MovieModal.tsx`) — el carrusel de anuncios ya no depende de esta clase.
- **Animaciones**: `calculateEntryDelay()` (`src/lib/animations.ts`) se usa igual que antes para el delay escalonado de las cards y de las reseñas del modal. El pop del botón de favoritos (`@keyframes favorite-pop`) se retriggerea con un estado local (`isPopping`) + `requestAnimationFrame` en vez de la manipulación manual de `classList`/reflow que hacía `core/animations.ts`.

## Al modificar `movies.json`

Cada película requiere: `id` (único), `title`, `titleEn`, `year`, `director`, `category`, `categoryEn`, `duration`, `rating`, `description`, `descriptionEn`, `image`. Si falta un campo `*En`, `Movie.Mapper.ts` cae al valor por defecto (español) en vez de mostrar `undefined` — pero de todas formas conviene completarlo siempre para que la vista en inglés tenga contenido real.
