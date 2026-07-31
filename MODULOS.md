# Módulos y servicios

Detalle de cada archivo `.ts` del proyecto: responsabilidad, qué expone (`export`) y de qué depende (`import`). Para el flujo completo entre módulos y las convenciones generales, ver [AGENTS.md](./AGENTS.md). Para el historial de la migración a TypeScript y la traducción de identificadores/datos a inglés, ver [MIGRACION-TYPESCRIPT.md](./MIGRACION-TYPESCRIPT.md).

## `src/entities/` — modelo de dominio

Interfaces puras, sin lógica. Es lo único que ven `core/`, `services/`, `cache/`, `orchestrator/` y `main.ts` — nunca un DTO.

### `Movie.ts`
- **Exports:** `interface Movie { id, title, titleEn, year, director, category, categoryEn, duration, rating, description, descriptionEn, image }`.

### `Review.ts`
- **Exports:** `interface Review { movieId, author, comment, rating }`.

### `Advertisement.ts`
- **Exports:** `interface Advertisement { title, text, backgroundImage, ctaText }`.

---

## `src/dtos/` — forma cruda de cada endpoint

### `Movie.DTO.ts` / `MoviesResponse.DTO.ts`
- **Responsabilidad:** modelar `movies.json` tal como llega, antes de mapear. `titleEn`/`categoryEn`/`descriptionEn` son opcionales acá (pueden faltar en el JSON).
- **Exports:** `interface MovieDTO`, `interface MoviesResponseDTO { movies: MovieDTO[] }`.

### `Review.DTO.ts` / `ReviewsResponse.DTO.ts`
- **Responsabilidad:** modelar `reviews.json` tal como llega.
- **Exports:** `interface ReviewDTO`, `interface ReviewsResponseDTO { reviews: ReviewDTO[] }`.

### `Advertisement.DTO.ts`
- **Responsabilidad:** modelar el mock de `Advertisements.Service.ts` tal como está hardcodeado (no viene de un `.json`).
- **Exports:** `interface AdvertisementDTO`.

---

## `src/mappers/` — funciones puras DTO → Entity

Sin DOM, sin `fetch`, sin side effects. Se llaman desde `services/`, nunca desde `core/`/`main.ts` directamente.

### `Movie.Mapper.ts`
- **Exports:** `mapMovieDtoToEntity(dto: MovieDTO): Movie`, `mapMoviesDtoToEntities(dtos: MovieDTO[]): Movie[]`.
- **Lógica:** copia campo a campo; si falta `titleEn`/`categoryEn`/`descriptionEn` en el DTO, cae al valor por defecto (`dto.titleEn ?? dto.title`, etc.) en vez de propagar `undefined`.

### `Review.Mapper.ts`
- **Exports:** `mapReviewDtoToEntity(dto: ReviewDTO): Review`, `mapReviewsDtoToEntities(dtos: ReviewDTO[]): Review[]`.
- **Lógica:** copia directa, sin fallback (todos los campos de `ReviewDTO` son obligatorios).

### `Advertisement.Mapper.ts`
- **Exports:** `mapAdvertisementDtoToEntity(dto: AdvertisementDTO): Advertisement`, `mapAdvertisementsDtoToEntities(dtos: AdvertisementDTO[]): Advertisement[]`.
- **Lógica:** copia directa.

---

## `src/core/` — módulos originales (misma lógica del live coding, tipada)

### `data.ts`
- **Responsabilidad:** `fetch()` de `movies.json`.
- **Exports:** `getMovies(): Promise<MovieDTO[]>` — lanza error si la respuesta no es `ok`. Devuelve DTOs crudos, sin mapear (el mapeo lo hace `Catalog.Service.ts`).
- **Imports:** `MovieDTO`, `MoviesResponseDTO` (`../dtos/`).

### `render.ts`
- **Responsabilidad:** construir las cards del DOM a partir de una lista de películas.
- **Exports:** `renderMovies(movies: Movie[], container: HTMLElement): void`.
- **Imports:** `isFavorite` (`favorites.ts`), `getTranslation`/`translateMovie` (`language.ts`), `calculateEntryDelay` (`animations.ts`), `Movie` (`../entities/`).
- **Nota:** traduce cada película en el momento de pintar (`translateMovie`), no antes — por eso el caché de género (`cache/Filter.Cache.ts`) puede guardar objetos sin traducir sin que se rompa nada.

### `modal.ts`
- **Responsabilidad:** abrir/cerrar el modal de detalle y rellenarlo con los `data-*` de una card.
- **Exports:** `openModal(data: DOMStringMap)`, `closeModal()`, `initializeModal()`.
- **Imports:** `getElement` (`dom.ts`).

### `favorites.ts`
- **Responsabilidad:** estado de favoritos en `localStorage` (clave `favorite-movies`) y contador del header.
- **Exports:** `isFavorite(id)`, `toggleFavorite(id)`, `countFavorites()`, `updateFavoritesCounter()`.
- **Imports:** ninguno.

### `filters.ts`
- **Responsabilidad:** poblar el `<select>` de categorías y filtrar por texto + categoría.
- **Exports:** `populateCategories(movies, selectElement)`, `filterMovies(movies, text, category)`.
- **Imports:** `translateMovie` (`language.ts`), `Movie` (`../entities/`).
- **Nota de integración:** `main.ts` siempre le pasa `"all"` como `category`, porque el filtro por género real ya lo resolvió `cache/Filter.Cache.ts` antes de llegar acá — evita el doble filtrado (ver sección de la caché más abajo).

### `language.ts`
- **Responsabilidad:** diccionario ES/EN y traducción de textos estáticos y de datos.
- **Exports:** `getLanguage()`, `getTranslation(key)`, `setLanguage(language)`, `translateMovie(movie)`, `applyLanguage()`.
- **Imports:** `Movie` (`../entities/`).
- **Persistencia:** `localStorage` bajo `preferred-language`.
- **Nota:** las **claves** del diccionario (`search`, `all`, `favorite`, `close`, `year`, `director`, `duration`, `rating`, `min`, `footer`, `error`) están en inglés (son identificadores); los **valores** de cada idioma se mantienen en español (`es`) e inglés (`en`) como contenido real de la UI.

### `animations.ts`
- **Responsabilidad:** retraso escalonado de entrada de las cards y retrigger del pop de favoritos.
- **Exports:** `calculateEntryDelay(index)`, `animateFavorite(button)`.
- **Imports:** ninguno.

### `dom.ts`
- **Responsabilidad:** tipar `document.getElementById` sin repetir aserciones non-null en cada módulo.
- **Exports:** `getElement<T extends HTMLElement = HTMLElement>(id: string): T` — tira `Error` si el id no existe.
- **Imports:** ninguno.

---

## `src/services/` — tres "backends" simulados, pensados para `Promise.allSettled`

Cada uno hace: obtener datos crudos → mapear DTO→Entity → resolver/rechazar con `Entity[]`.

### `Catalog.Service.ts`
- **Responsabilidad:** exponer el catálogo con la misma interfaz que los otros dos servicios, delegando en `data.ts` + `Movie.Mapper.ts`. Nunca falla a propósito.
- **Exports:** `getCatalog(): Promise<Movie[]>`.
- **Imports:** `getMovies` (`../core/data.ts`), `mapMoviesDtoToEntities` (`../mappers/Movie.Mapper.ts`), `Movie` (`../entities/`).
- **Lógica:** wrapper directo, sin `try/catch` propio — si el `fetch` real falla, el rechazo se propaga tal cual.

### `Reviews.Service.ts`
- **Responsabilidad:** simular un servicio externo de reseñas de usuarios, con fallo aleatorio o forzado.
- **Exports:** `getReviews(): Promise<Review[]>`.
- **Imports:** `mapReviewsDtoToEntities` (`../mappers/Review.Mapper.ts`), `Review`/`ReviewDTO`/`ReviewsResponseDTO`. Hace su propio `fetch()` de `reviews.json`, igual que `core/data.ts` hace con `movies.json`.
- **Parámetros de simulación:** `DELAY_MS = 700`, `PROBABILITY_OF_FAILURE = 0` (dejado en `0` a propósito; subir el valor para volver a ver fallos aleatorios). Primero se cumple el delay/fallo simulado (`setTimeout`); solo si no le tocó fallar, recién ahí dispara el `fetch()` real de `reviews.json`.
- **Fallo forzado:** `?forceFail=reviews` o `?forceFail=all` en la URL saltea el `Math.random()` y siempre rechaza (sin llegar a pedir el JSON).
- **Fuente de datos (`reviews.json`, raíz del proyecto):** `{ "reviews": [{ movieId, author, comment, rating }, ...] }`, 187 reseñas repartidas sobre las 30 películas de `movies.json` con esta distribución (pedida explícitamente, no arbitraria): 3 películas (10%) con más de 10 reseñas — incluye Matrix (id 2) con 15, a propósito para poder demostrar el scroll de `#modal-reviews` —, 9 (30%) con exactamente 9, 9 (30%) entre 5 y 8, 4 (15%, redondeando 4.5 hacia abajo) entre 1 y 4, y 5 (15%, redondeando hacia arriba) sin ninguna reseña. `main.ts` consume el array completo tal cual y filtra por `movieId` recién al abrir el modal de una película. Si se agregan películas nuevas a `movies.json`, `reviews.json` no se actualiza solo — hay que sumarle sus reseñas a mano (o dejarla en el bucket "sin reseñas" si no aplica).

### `Advertisements.Service.ts`
- **Responsabilidad:** simular el servicio de anuncios promocionales, mismo patrón que reviews pero independiente (para que no fallen/resuelvan en sincronía).
- **Exports:** `getAdvertisements(): Promise<Advertisement[]>`.
- **Imports:** `mapAdvertisementsDtoToEntities` (`../mappers/Advertisement.Mapper.ts`), `Advertisement`/`AdvertisementDTO`.
- **Parámetros de simulación:** `DELAY_MS = 500`, `PROBABILITY_OF_FAILURE = 0`, independiente de `Reviews.Service.ts`.
- **Fallo forzado:** `?forceFail=advertisements` o `?forceFail=all`.
- **Mock:** 3 anuncios (`title`, `text`, `backgroundImage`, `ctaText`) — el copy (`Semana del Cine Clásico`, etc.) se mantiene en español a propósito, es contenido — cada uno con su imagen de fondo en `banners/` (`SemanaCineClasico.webp`, `EstrenosCienciaFiccion.webp`, `MaratonDeTerror.webp`) y su propio texto de botón. Se consumen desde `main.ts` como un carrusel (ver más abajo), no como una lista fija.

---

## `src/orchestrator/orchestrateServices.ts`

- **Responsabilidad:** disparar los tres servicios en paralelo con `Promise.allSettled` y devolver un resultado consolidado.
- **Exports:** `orchestrateServices(): Promise<OrchestrationResult>` donde `OrchestrationResult = { movies: Movie[], reviews: Review[] | null, advertisements: Advertisement[] | null }`.
- **Imports:** `getCatalog` (`../services/Catalog.Service.ts`), `getReviews` (`../services/Reviews.Service.ts`), `getAdvertisements` (`../services/Advertisements.Service.ts`).
- **Lógica:**
  - Si `catalog` rechaza → propaga el error (fatal; lo atrapa el `catch` de `start()` en `main.ts`).
  - Si `reviews`/`advertisements` rechazan → se devuelven como `null` (con `console.warn` del motivo), sin romper el resto del flujo.

---

## `src/cache/Filter.Cache.ts`

- **Responsabilidad:** filtrar películas por género con un caché privado por closure, para no repetir la simulación de latencia en géneros ya consultados.
- **Exports:** `createMovieFilter(movies: Movie[]): MovieFilter` donde `MovieFilter = { filterByGenre(genre): Promise<Movie[]> }`.
- **Imports:** `Movie` (`../entities/`).
- **Parámetros de simulación:** `DELAY_MS = 500`.
- **Detalles clave del diseño:**
  - El caché se indexa por la **categoría canónica** (`movie.category`), no por el texto que muestra el `<select>` — así no se invalida al cambiar de idioma ("Acción" en ES y "Action" en EN resuelven a la misma clave, vía un mapa `category`/`categoryEn` → clave canónica construido una sola vez, de forma sincrónica, al crear la instancia).
  - `"all"` devuelve el array completo sin tocar el caché.
  - La promesa se guarda en el caché **antes** de esperarla, así dos llamadas simultáneas al mismo género comparten la misma promesa en vez de disparar dos simulaciones.
  - Los objetos que cachea son siempre los **originales sin traducir** (nunca copias de `translateMovie`), para que `render.ts` los traduzca correctamente sin importar en qué idioma se cacheó el resultado.

---

## `src/main.ts`

- **Responsabilidad:** único punto de entrada; orquesta `orchestrateServices()`, crea el filtro de género, conecta todos los eventos delegados y arma el panel de reseñas del modal.
- **No exporta nada** (se autoejecuta con `start()` al final del archivo).
- **Imports:** todos los `core/*` necesarios (incluye `calculateEntryDelay` de `animations.ts`, reutilizado para el delay escalonado de las reseñas), `orchestrateServices` (`./orchestrator/orchestrateServices.ts`), `createMovieFilter` (`./cache/Filter.Cache.ts`).
- **Flujo relevante:**
  - `start()`: llama a `orchestrateServices()`, guarda `movies` y `reviews` (esta última puede quedar en `null` si el servicio falló), crea `movieFilter = createMovieFilter(movies)`, renderiza catálogo + banner de anuncios (solo si `advertisements` no es `null`).
  - **Carrusel de anuncios:** `renderAds(data)` no pinta una lista fija — guarda `data` en la variable de módulo `advertisements`, arma los puntos indicadores (`#ads-dots`) y pinta el primer slide (`paintCurrentAdSlide()`), que setea `adsSlide.style.backgroundImage` (degradado + `backgroundImage` del anuncio) y el HTML del título/texto/CTA. `goToAd(index)` navega circularmente (`(index + advertisements.length) % advertisements.length`) y reinicia el autoplay; `restartAdsAutoplay()` limpia el `setInterval` anterior y arma uno nuevo cada `AUTOPLAY_INTERVAL_MS` (6000ms) — solo si hay más de un anuncio. Las flechas (`#ads-prev`/`#ads-next`) y el click delegado en `#ads-dots` llaman a `goToAd()`. Si solo hay un anuncio, se agrega la clase `ads--single` para ocultar flechas/indicadores por CSS.
  - `applyFilters()` (async): deshabilita `#category-filter`, resuelve el género vía `movieFilter.filterByGenre(...)`, aplica `filterMovies(result, text, "all")`, renderiza, y rehabilita el select en un `finally` (evita condiciones de carrera si el usuario cambia de género rápido).
  - `handleContainerClick()`: al hacer click en una card (fuera del botón de favorito), llama a `openModal(card.dataset)` y, a continuación, a `renderModalReviews(Number(card.dataset.id))`.
  - `renderModalReviews(movieId)`: siempre arranca ocultando y vaciando `#modal-reviews`; si `reviews` es `null` (el servicio falló) o no hay ninguna reseña con ese `movieId`, no hace nada más — `#modal-reviews` queda con `display: none` (no ocupa espacio) y el modal se centra solo. Si hay reseñas para esa película, las pinta dentro de `#modal-reviews` (una `animation-delay` por índice vía `calculateEntryDelay`) y le saca la clase `hidden`. Como `#modal-reviews` es hijo del mismo `#modal-overlay` que `.modal`, se abre y cierra junto con el modal sin necesidad de tocar `core/modal.ts`.
- **Estilo visual (`styles.css`):** `#modal-reviews` es transparente (sin fondo/borde/sombra propios); el efecto "flotante" está en cada `.modal-reviews__item`: sombra individual, rotación alterna por `nth-child` (impar/par) que se endereza al hover, y `@keyframes review-float` (entrada deslizando desde la derecha) combinada con el `animation-delay` que pone `main.ts`. El scrollbar de `#modal-reviews` está reestilado a mano (`scrollbar-color`/`scrollbar-width` para Firefox, `::-webkit-scrollbar*` para Chrome/Edge/Safari) con pista transparente y "thumb" en `--color-primario`, en vez del scrollbar gris por defecto del navegador.
- **`.hidden` necesita `!important` (`styles.css`):** `.modal-reviews` y `.ads` declaran su propio `display: flex`. Como `.hidden { display: none; }` estaba definida antes que esas reglas en el archivo y todas tienen la misma especificidad (una sola clase), le ganarían por orden de aparición si no fuera por `!important` — el panel de reseñas vacío quedaría ocupando 260px en el `flex` de `#modal-overlay` y correría el modal hacia la izquierda en vez de centrarlo solo. Fix: `.hidden { display: none !important; }`. Cualquier elemento nuevo que se oculte con esta clase y también declare `display` queda cubierto sin tocar nada más.
