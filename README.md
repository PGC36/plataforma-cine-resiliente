# Capy Films 🎬

Catálogo de películas hecho en React + Next.js (App Router).

## Características

- Grid responsivo de películas con póster, categoría, año, director, duración y calificación.
- Buscador por texto y filtro por categoría.
- Modal de detalle con la información completa de cada película.
- Favoritos persistidos en `localStorage`.
- Selector de idioma Español / Inglés.
- Pósters propios en formato `.webp`, mostrados completos (sin recortar) tanto en las cards como en el modal.
- Arquitectura en capas (DTO → mapper → entity) que sanea los datos crudos antes de que lleguen a la UI.

## Cómo correrlo

```bash
npm install
npm run dev
# abrir http://localhost:3000
```

`npm run build` genera el build de producción; `npm run start` lo sirve. `npm run lint` corre ESLint (config de Next).

## Estructura del proyecto

```
app/
  layout.tsx          Metadata, <LanguageProvider>, importa app/globals.css.
  page.tsx              Renderiza <CatalogPage />.
  globals.css            Todo el CSS del proyecto.
public/
  movies.json            Fuente de datos (30 películas, claves en inglés).
  reviews.json            Reseñas mock (187 items), fetched por Reviews.Service.ts.
  posters/                Pósters de cada película (.webp).
  banners/                Imágenes de fondo del carrusel de anuncios (.webp, 1600x500).
  images/                 Logo y logotipo de texto del header.
src/
  entities/               Modelo de dominio: Movie, Review, Advertisement.
  dtos/                    Forma cruda de cada endpoint antes de mapear.
  mappers/                 Funciones puras DTO → Entity.
  services/               Tres "backends" simulados, consumidos en paralelo por hooks:
    Catalog.Service.ts          fetch de movies.json + mapper (nunca falla).
    Reviews.Service.ts          Reseñas mock por película, con fallo simulado.
    Advertisements.Service.ts   Anuncios mock (carrusel/hero banner), con fallo simulado.
  hooks/
    useCatalog.ts, useReviews.ts, useAdvertisements.ts   Un hook por servicio,
                            cada uno con su propio { data, loading, error }.
    useFavorites.ts          Favoritos en localStorage.
    useLanguage.tsx           Context + Provider ES/EN, localStorage, traducción de datos.
    useGenreFilter.ts         Caché de filtrado por género con latencia simulada
                            solo la primera vez que se consulta cada género.
    useDebouncedValue.ts      Debounce genérico (buscador).
  lib/
    animations.ts             calculateEntryDelay (entrada escalonada de las cards).
    filterMovies.ts            Filtro de texto sobre el título ya traducido.
  components/
    CatalogPage.tsx            Compone todo; dueño del estado de búsqueda/categoría/
                              película seleccionada.
    Header.tsx, AdsCarousel.tsx, SearchBar.tsx, MovieGrid.tsx, MovieCard.tsx,
    MovieModal.tsx, Footer.tsx
```

Para forzar en vivo el fallo de un servicio secundario, agregar `?forceFail=reviews`, `?forceFail=advertisements` o `?forceFail=all` a la URL.

## Contribuir

Para más detalle sobre convenciones del proyecto, ver [AGENTS.md](./AGENTS.md). Para el detalle archivo por archivo de cada módulo, hook y componente, ver [MODULOS.md](./MODULOS.md). Para el historial de migraciones: de JS vanilla a TypeScript, ver [MIGRACION-TYPESCRIPT.md](./MIGRACION-TYPESCRIPT.md); de TypeScript vanilla a React + Next.js, ver [MIGRACION-REACT-NEXTJS.md](./MIGRACION-REACT-NEXTJS.md).
