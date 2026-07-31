# AGENTS.md

Guía para agentes de IA (y humanos) que trabajen en este proyecto: catálogo de películas en HTML/CSS/TypeScript, compilado con `tsc`, sin bundler ni frameworks.

## Qué es esto

Sitio estático (`index.html` + `styles.css` + `dist/*.js`, compilado desde `src/*.ts`) que muestra un catálogo de películas leído desde `movies.json`. Incluye: grid responsivo, modal de detalle, favoritos persistidos, buscador + filtro de categoría, selector de idioma ES/EN, orquestación concurrente de servicios simulados (catálogo/reseñas/anuncios), un caché de filtrado por género con closure, y una arquitectura en capas (DTO → mapper → entity) que sanea los datos crudos antes de que lleguen a la UI.

Para el detalle archivo por archivo de cada módulo y servicio (responsabilidad, exports, imports, lógica interna), ver [MODULOS.md](./MODULOS.md). Para el historial completo de la migración de JS vanilla a esta arquitectura en TypeScript (qué cambió, cuándo y por qué — incluida la traducción de identificadores/datos a inglés), ver [MIGRACION-TYPESCRIPT.md](./MIGRACION-TYPESCRIPT.md).

## Cómo correrlo

Hay un paso de compilación con TypeScript (`tsc`), sin bundler — Node/npm hacen falta solo para eso, el sitio servido sigue siendo HTML/CSS/JS estático:

```bash
npm install         # una vez, instala typescript (ver package.json)
npx tsc              # compila src/*.ts → dist/*.js (o: npm run build)
python3 -m http.server 8123
# abrir http://localhost:8123
```

`index.html` carga `dist/main.js` como módulo ES (`<script type="module">`) y usa `fetch()`, así que **debe servirse por HTTP**, nunca abrirse con `file://`. Hay que recompilar (`npx tsc`) después de cada cambio en `src/` — `dist/` es 100% generado, está en `.gitignore` y nunca se versiona ni se edita a mano.

`tsconfig.json` tiene `strict`, `noImplicitAny` y `noEmitOnError` activados: si hay un solo error de tipos, `tsc` no genera nada (por diseño, ver la consigna del laboratorio en [MIGRACION-TYPESCRIPT.md](./MIGRACION-TYPESCRIPT.md)).

## Estructura de archivos

```
index.html         Maquetación completa: header (logo + título, favorites-counter,
                    language-button), banner de anuncios / carrusel (#ads-section,
                    hidden si el servicio falla), search-bar (search-input +
                    category-filter, debajo del banner), movies-container (vacío,
                    se llena por JS), modal + panel flotante de reseñas
                    (#modal-reviews, al lado del modal, hidden si el servicio
                    falló o la película no tiene reseñas), footer.
styles.css          Todo el CSS. Grid responsivo con auto-fill/minmax, dark theme fijo.
movies.json         Fuente de datos. Un array "movies" con 30 items (claves en
                    inglés: title, year, category, duration, rating, description,
                    image, + variantes *En para el modo inglés).
reviews.json        Reseñas mock. Un array "reviews" con 187 items ({ movieId,
                    author, comment, rating }), fetched por reviewsService.ts.
posters/            Pósters propios de cada película, en formato .webp.
banners/            Imágenes de fondo del carrusel de anuncios (.webp, 1600x500),
                    una por promo (SemanaCineClasico, EstrenosCienciaFiccion,
                    MaratonDeTerror) + _ejemplo-placeholder.webp (referencia de
                    tamaño/convención, no se usa en el código).
tsconfig.json       Config de TypeScript: rootDir "src", outDir "dist", strict +
                    noImplicitAny + noEmitOnError, module "nodenext" (imports
                    con extensión .js, lo que ya necesita un <script type="module">
                    nativo sin bundler).
src/
  entities/         Modelo de dominio — lo único que consumen core/, services/,
                    cache/, orchestrator/ y main.ts:
    Movie.ts, Review.ts, Advertisement.ts.
  dtos/             Forma cruda de cada "endpoint", antes de mapear:
    Movie.DTO.ts + MoviesResponse.DTO.ts   (envelope de movies.json)
    Review.DTO.ts + ReviewsResponse.DTO.ts (envelope de reviews.json)
    Advertisement.DTO.ts                   (forma del mock de anuncios)
  mappers/          Funciones puras DTO → Entity (sin DOM, sin fetch, sin side
                    effects), una por dominio:
    movieMapper.ts, reviewMapper.ts, advertisementMapper.ts.
  core/             Módulos originales del proyecto (misma lógica que la versión
                    JS, ahora tipados e identificadores en inglés):
    data.ts           fetch() de movies.json, devuelve MovieDTO[] crudo.
    render.ts         Construye las cards del DOM a partir de Movie[].
    modal.ts          Abre/cierra el modal y lo rellena con los datos de una card.
    favorites.ts      Estado de favoritos en localStorage + contador del header.
    filters.ts        Búsqueda por texto y filtro por categoría. Recibe siempre
                      "all" como categoría desde main.ts, porque el filtro por
                      género real ya lo resolvió cache/filterCache.ts antes —
                      evita el doble filtrado por categoría (ver más abajo).
    language.ts       Diccionario ES/EN, traducción de textos estáticos y de datos.
    animations.ts     Retraso escalonado de entrada de las cards y retrigger
                      del pop del botón de favoritos.
    dom.ts            Helper getElement<T>(id) que tipa getElementById y tira
                      si el elemento no existe (en vez de HTMLElement | null
                      repetido en todo el código).
  services/         Tres "backends" simulados, pensados para consumirse en
                    paralelo — cada uno mapea su DTO a Entity antes de resolver:
    catalogService.ts         Wrapper de data.ts + movieMapper. Nunca falla a
                              propósito.
    reviewsService.ts         fetch() de reviews.json (187 reseñas, ver
                              ../reviews.json), filtrado por movieId desde
                              main.ts al abrir el modal. Falla con probabilidad
                              aleatoria simulada (actualmente PROBABILITY_OF_FAILURE
                              = 0, ver Convenciones), o de forma forzada vía
                              ?forceFail=reviews (o "all") — en ese caso ni
                              siquiera llega a pedir el JSON.
    advertisementsService.ts  3 anuncios mock ({ title, text, backgroundImage,
                              ctaText }), cada uno con su imagen en banners/.
                              Mismo patrón de fallo que reviewsService.ts, con
                              ?forceFail=advertisements (o "all"), independiente
                              entre sí. Se consumen como carrusel, no como
                              lista fija (ver flujo y convenciones más abajo).
  cache/
    filterCache.ts    createMovieFilter(movies) devuelve un objeto con
                      filterByGenre(genre), que encapsula un caché privado
                      por closure. Cachea por categoría canónica (el campo
                      category de cada película), no por el texto que muestra
                      el <select> — así el caché no se invalida al cambiar de
                      idioma (ver "Convenciones" para el detalle del bug que evita).
  orchestrator/
    orchestrateServices.ts   Promise.allSettled sobre los tres services.
                            Si el catálogo falla, propaga el error (fatal).
                            Si reviews o advertisements fallan, devuelve null
                            para esa parte sin romper el resto.
  main.ts           Punto de entrada: llama a orchestrateServices(), crea el
                    filtro de género, conecta todos los eventos delegados.
```

## Flujo (cómo se conectan los módulos)

```
                        ┌─────────────┐
                        │  main.ts    │  único punto de entrada
                        └──────┬──────┘
                               │ start()
                               ▼
                orchestrateServices() ──── Promise.allSettled ────┐
                               │                                    │
          ┌────────────────────┼────────────────────┐              │
          ▼                    ▼                     ▼             │
   catalogService.ts    reviewsService.ts   advertisementsService.ts│
   (data.ts + mapper,   (mock, falla         (mock, falla           │
    nunca falla)          aleatorio/forzado)   aleatorio/forzado)   │
          │                    │                     │              │
          ▼                    ▼                     ▼              │
   { movies, reviews: null si falló, advertisements: null si falló } ◄──┘
       │
       ├─ advertisements (si no es null) → pinta #ads-section
       ├─ reviews guardado en memoria (main.ts), se filtra por película recién al abrir el modal
       │
       ▼
   movies[] (en memoria, dentro de main.ts) — ya son Movie[] (entities), no DTOs
       │
       ├──────────────┬──────────────┐
       ▼               ▼              ▼
   language.ts       modal.ts     favorites.ts
   applyLanguage()   init listeners  contador
   (una vez, al inicio)
       │
       ▼
   createMovieFilter(movies) → movieFilter (cache/filterCache.ts)
       │  guarda un caché privado por closure, keyed por categoría canónica
       ▼
   render.ts → renderMovies(lista, container)
       │  por cada película: translateMovie() (language.ts) → crea <article class="card">
       │  con dataset.* (title, year, director, category, duration,
       │  rating, description, image) — el modal lee estos data-*
       ▼
   container#movies-container (delegación de eventos en main.ts)
       │
       ├─ click en .card__favorite → favorites.toggleFavorite(id) → updateFavoritesCounter()
       └─ click en .card (resto)   → modal.openModal(card.dataset)
                                       + main.ts filtra `reviews` por movieId
                                         y pinta #modal-reviews (o lo deja hidden
                                         si el servicio falló o no hay reseñas
                                         para esa película — el modal se comporta
                                         igual que siempre en ese caso)
```

Filtrado (`applyFilters()` en `main.ts`, async):

1. `await movieFilter.filterByGenre(categoryFilter.value)` → resuelve el género vía caché (instantáneo) o vía la simulación de latencia (primera vez para ese género), en cualquier idioma. Mientras está en vuelo, `#category-filter` se deshabilita para evitar condiciones de carrera entre géneros.
2. El resultado se pasa a `filterMovies(resultado, searchInput.value, "all")` de `filters.ts` — se le fuerza `"all"` como categoría porque el género ya fue resuelto en el paso 1, evitando el doble filtrado.
3. `renderMovies()` pinta el resultado final.

Eventos disparados por el usuario y su efecto:

| Evento                            | Módulo que reacciona | Efecto |
|------------------------------------|------------------------|--------|
| input en `#search-input`           | `main.ts` → `cache/filterCache.ts` → `filters.ts` | re-renderiza cards filtradas (con debounce de 300ms) |
| change en `#category-filter`       | `main.ts` → `cache/filterCache.ts` → `filters.ts` | ídem; deshabilita el select mientras resuelve el género |
| click en `#language-button`        | `main.ts` → `language.ts`  | traduce textos estáticos, repuebla categorías, re-renderiza cards en el nuevo idioma |
| click en `.card__favorite`         | `main.ts` → `favorites.ts` | toggle en localStorage + actualiza contador |
| click en `.card` (resto)           | `main.ts` → `modal.ts` + `main.ts` (`#modal-reviews`) | abre modal con los datos de esa card y pinta sus reseñas (si hay) al lado |
| click en cerrar / overlay / Esc    | `modal.ts`               | cierra modal (y con él, `#modal-reviews`, que es hijo del mismo overlay), restaura scroll del body |

## Convenciones del proyecto

- **Idioma del código**: nombres de variables, funciones, tipos, ids y clases HTML/CSS, y comentarios en **inglés** (ver [MIGRACION-TYPESCRIPT.md](./MIGRACION-TYPESCRIPT.md) §9 para el historial de esta traducción). El **contenido** (títulos/descripciones de películas, comentarios de reseñas, copy de los anuncios) se mantiene en español porque son datos, no código — no traducir `movies.json`/`reviews.json` ni el copy de `advertisementsService.ts` como si fueran identificadores. Los mensajes de UI usan el diccionario de `language.ts`, no strings sueltos.
- **Sin dependencias externas más allá de TypeScript**: nada de bundlers ni frameworks. `typescript` es la única dependencia de `package.json`, usada solo para compilar (`tsc`), no en runtime. Si hace falta algo nuevo, evaluar primero si se puede resolver con TS/CSS vanilla.
- **Traducción de datos**: `movies.json` guarda pares por idioma (`title`/`titleEn`, `category`/`categoryEn`, `description`/`descriptionEn`). Año, director, duración, calificación e imagen son iguales en ambos idiomas. Para leer el campo correcto según idioma, usar siempre `translateMovie()` de `language.ts` — no leer `movie.title` directamente en código que deba soportar ambos idiomas.
- **Favoritos**: el estado vive en `localStorage` bajo la clave `favorite-movies` (ver `favorites.ts`). No hay backend.
- **Preferencia de idioma**: persiste en `localStorage` bajo `preferred-language`.
- **Imágenes**: los pósters están en `posters/`, en formato `.webp`, y el campo `image` del JSON apunta a esa ruta relativa (p. ej. `posters/Matrix.webp`). Si se agrega una película nueva, su póster debe seguir la misma convención (archivo `.webp` en `posters/`, nombre sin espacios en PascalCase).
- **Cards con alto fijo**: `.card` tiene `height` fijo en `styles.css` — si se agregan más datos a la card, cuidar que no rompan el layout (usar `overflow: hidden` / `text-overflow: ellipsis` como ya se hace con el título).
- **Pósters completos, sin recortar**: `.card__image` y `.modal__image` usan `object-fit: contain` (no `cover`) para que la portada se vea íntegra, ya que los pósters no comparten todos el mismo aspect ratio. Si se ajusta el alto de la card o del modal, mantener `contain` y un alto uniforme para todas las películas.
- **Logo y título del header**: el `<h1>` usa `<object data="images/titleText.png" type="image/png">Capy Films</object>` — si `titleText.png` no carga, el navegador renderiza el texto "Capy Films" como fallback nativo (sin JS). `.header__title-image` fuerza `color: #000` + `filter: invert(1)` para que el título se vea blanco tanto con la imagen (negra sobre transparente) como con el texto de fallback. Si se reemplaza `titleText.png`, debe seguir siendo negro sobre fondo transparente para que la inversión funcione. El logo (`images/logo.png`) va a la izquierda del título dentro de `.header__brand`.
- **Header responsive**: `.header` se mantiene siempre en fila (nunca `flex-direction: column`) para que el contador de favoritos y el botón de idioma queden fijos a la derecha del título en cualquier ancho de pantalla. En el media query de 768px solo se reducen tamaños (logo, título, badges), no se apila el layout.
- **Animación de entrada de las cards**: `.card` anima con `@keyframes card-appears` (fade + `translateY`) cada vez que se renderiza, con `animation-delay` escalonado por índice (calculado por `calculateEntryDelay()` en `animations.ts`, usado desde `render.ts`, tope en 15 cards) para el efecto cascada. Respeta `prefers-reduced-motion`. Como `renderMovies()` se llama en cada re-render (buscador, filtro, cambio de idioma), el buscador tiene un **debounce de 300ms** (`applyFiltersWithDelay` en `main.ts`) para no re-disparar la animación en cada tecla mientras el usuario escribe. Si se agrega otro input que dispare `applyFilters()` en tiempo real, aplicar el mismo patrón de debounce.
- **Animación del botón de favoritos**: al hacer click en `.card__favorite`, `animateFavorite()` (`animations.ts`) fuerza un reflow y reaplica la clase `animate`, que dispara `@keyframes favorite-pop` en `styles.css` (también respeta `prefers-reduced-motion`). Ese reflow es necesario para que la animación se reinicie en clicks consecutivos rápidos sobre la misma card.
- **Animaciones centralizadas**: toda la lógica de animaciones (retraso de entrada, retrigger del pop de favoritos) vive en `src/core/animations.ts`, no inline en `render.ts`/`main.ts`. Si se agrega una animación nueva disparada desde JS, seguir este mismo patrón: la función que la dispara/calcula va en `animations.ts` y se importa donde se necesite.
- **`core/` no se reescribe sin motivo**: los módulos de `src/core/` son la evolución tipada del código original del live coding. Cambios de integración (nuevos parámetros, nuevas llamadas) se hacen desde quien los consume (`main.ts`, `cache/filterCache.ts`), no editando su lógica interna, salvo que se detecte un bug real en ellos.
- **DTOs/mappers/entities como capas separadas**: `core/`, `services/`, `main.ts` nunca importan un `*DTO` directamente salvo dentro de su propio `services/*.ts` (que es quien mapea). Si se agrega un campo nuevo a un endpoint, el flujo es: 1) agregarlo al DTO correspondiente (`dtos/`), 2) mapearlo en el mapper (`mappers/`), 3) agregarlo a la entity (`entities/`) — nunca saltear el mapper leyendo el DTO crudo más arriba en la cadena.
- **Servicios simulados independientes entre sí**: `reviewsService.ts` y `advertisementsService.ts` tienen su propia probabilidad de fallo (`PROBABILITY_OF_FAILURE`, actualmente en `0` en ambos — dejado en el código a propósito para poder subirlo fácil si hace falta demostrar fallos aleatorios de nuevo) y su propio delay — no comparten estado ni deben fallar "en bloque". `catalogService.ts` nunca falla a propósito: es el único dato indispensable para renderizar.
- **Fallo forzado para demos/grabaciones**: el query param `?forceFail=reviews|advertisements|all` salta el `Math.random()` y fuerza el rechazo del/los servicio(s) indicado(s), sin afectar el comportamiento aleatorio normal cuando el parámetro no está presente. Usar esto para mostrar el fallo en vivo sin depender de la suerte (importante: el nombre del parámetro y sus valores están en inglés, distinto del proyecto original en español).
- **`orchestrateServices()` es el único punto que llama a `Promise.allSettled`**: si el catálogo falla, propaga el error (lo atrapa el `catch` de `start()` en `main.ts`, que ya muestra el mensaje de error traducido). Si reviews o advertisements fallan, se resuelven como `null` — nunca deben tumbar el render del catálogo.
- **Reseñas ligadas a la película abierta, no una sección global**: `reviewsService.ts` devuelve todas las reseñas mock (con su `movieId`); `main.ts` las guarda tal cual en memoria y recién las filtra por `movieId` cuando se abre el modal (`renderModalReviews`), pintando `#modal-reviews` como panel flotante al lado del `.modal` (mismo `#modal-overlay`, por eso se abre/cierra junto con el modal sin tocar `modal.ts`). Si el servicio falló (`reviews === null`) o la película no tiene reseñas, `#modal-reviews` queda hidden (`display: none`, no ocupa espacio) y el modal se centra solo, exactamente igual que antes de esta función. `#modal-reviews` tiene `overflow-y: auto` con `max-height` fija — si una película llega a tener muchas reseñas, se scrollea en vez de estirar el modal.
- **Estética "flotante" de las reseñas del modal**: `#modal-reviews` en sí es transparente (sin fondo/borde/sombra) — el efecto visual vive en cada `.modal-reviews__item`: sombra propia, rotación leve alternada (impar/par, enderezada al hover) y animación de entrada (`@keyframes review-float` en `styles.css`) con delay escalonado por índice, reutilizando `calculateEntryDelay()` de `animations.ts` (mismo helper que ya usan las cards del grid, no se creó uno nuevo). Si se agregan más reseñas mock, no hace falta tocar el CSS ni el JS: el `nth-child` y el índice del `.map()` en `main.ts` escalan solos.
- **Scrollbar de `#modal-reviews` con la paleta del sitio**: por defecto el navegador dibuja el scroll con los colores del sistema (gris claro), que desentona contra el dark theme. Se sobreescribe con `scrollbar-width`/`scrollbar-color` (Firefox) y los pseudo-elementos `::-webkit-scrollbar*` (Chrome/Edge/Safari): pista transparente y "thumb" en `--color-primario` (con un tono más claro al hover). Si se agrega scroll a otro contenedor nuevo, replicar este mismo patrón en vez de dejar el scrollbar por defecto del navegador.
- **Caché de género por closure (`cache/filterCache.ts`)**: el caché se indexa por la categoría canónica (`movie.category`), nunca por el texto que muestra el `<select>` (que cambia con el idioma: "Acción" vs "Action"). Esto es intencional — cachear por el string del select rompería el caché al cambiar de idioma. Si se toca este archivo, mantener esa indirección (mapa `category`/`categoryEn` → clave canónica).
- **Anuncios como hero banner / carrusel, no como lista de recuadros**: `#ads-section` muestra un slide grande a la vez (imagen de fondo + degradado + título/texto/CTA), con flechas y puntos indicadores, en vez de mostrar todos los anuncios juntos compitiendo por atención. `main.ts` mantiene el estado (`advertisements`, `currentAdIndex`) y hace autoplay cada 6s (`restartAdsAutoplay`), que se reinicia con cada interacción manual. Si se agrega un cuarto anuncio, no hace falta tocar el JS ni el CSS — el `.map()` de los indicadores y la navegación circular escalan solos.
- **Padding del slide de anuncios pensado para las flechas**: `.ads__slide` tiene `padding: 2rem 3.75rem` (y `1.25rem 3.25rem` en el media query de 768px) a propósito — un padding menor hace que el título/CTA quede debajo de `.ads__arrow--left` (bug real que pasó: con `padding: 2rem` uniforme, la flecha de 2.25rem de ancho posicionada a `left: 1rem` tapaba la "M" de los títulos). Si se cambia el tamaño de las flechas, recalcular este padding para que siga habiendo espacio libre entre el borde de la flecha y el contenido.
- **Imágenes de `banners/` sin texto horneado**: las imágenes de fondo del carrusel (`banners/*.webp`) son solo arte visual — el título, texto y CTA de cada anuncio los pone `main.ts` con HTML/CSS encima, nunca están escritos dentro de la imagen. Esto permite traducir o cambiar el copy sin regenerar el arte. `banners/_ejemplo-placeholder.webp` es la única excepción (tiene texto "PLACEHOLDER" a propósito) y no está referenciado desde ningún `service` — es solo documentación visual de la dimensión/convención (1600×500) para cuando se agregue una promo nueva sin arte todavía.
- **Sin doble filtrado por categoría**: `main.ts` siempre le pasa `"all"` como categoría a `filterMovies()` de `filters.ts`, porque el filtro por género ya lo resolvió `filterCache.ts` antes. No cambiar esto sin ajustar también `filterCache.ts` — si ambos filtran por categoría, se duplica trabajo (aunque el resultado final sea el mismo).
- **`.hidden` usa `!important` a propósito**: es la utilidad genérica para "ocultar del todo" (`#ads-section`, `#modal-reviews`). Sin `!important`, cualquier regla futura que declare `display` sobre ese mismo elemento (como `.ads { display: flex; }` o `.modal-reviews { display: flex; }`) le gana a `.hidden` por orden de aparición en el archivo aunque tengan la misma especificidad — eso pasó realmente (con el nombre viejo `.oculto`): con `#modal-reviews` sin reseñas, quedaba como caja vacía ocupando espacio en el `flex` del `#modal-overlay` y corría el modal hacia la izquierda en vez de dejarlo centrado. Si se agrega un nuevo elemento que se oculte con `.hidden` y también declare su propio `display`, no hace falta nada más — `!important` ya lo cubre.

## Al modificar `movies.json`

Cada película requiere: `id` (único), `title`, `titleEn`, `year`, `director`, `category`, `categoryEn`, `duration`, `rating`, `description`, `descriptionEn`, `image`. Si falta un campo `*En`, `movieMapper.ts` cae al valor por defecto (español) en vez de mostrar `undefined` — pero de todas formas conviene completarlo siempre para que la vista en inglés tenga contenido real.
