# Migración a React + Next.js — 2026-08-05

Registro de la migración del catálogo de películas, de TypeScript vanilla compilado con `tsc` (ver [MIGRACION-TYPESCRIPT.md](./MIGRACION-TYPESCRIPT.md)) a React + Next.js (App Router). Mantiene la arquitectura de capas de datos documentada en [AGENTS.md](./AGENTS.md) y [MODULOS.md](./MODULOS.md), ambos ya actualizados a la estructura nueva; esto es un registro de **qué cambió y por qué**, no los reemplaza.

## 1. Decisiones de arquitectura

- **App Router** (`app/`), no Pages Router.
- **Data fetching 100% client-side**, igual que antes: los tres "backends" simulados (catálogo, reseñas, anuncios) con `fetch` + delay + fallo aleatorio/forzado (`?forceFail=`) se mantienen tal cual, corriendo en el navegador.
- **Sin orquestador central**: `orchestrator/orchestrateServices.ts` (que disparaba los tres servicios con `Promise.allSettled` a mano) se eliminó. Cada servicio se expone como un hook independiente (`useCatalog`, `useReviews`, `useAdvertisements`), cada uno con su propio `{ data, loading, error }`. El comportamiento observable es el mismo: el catálogo sigue siendo obligatorio (su error es fatal) y reseñas/anuncios siguen siendo opcionales.
- **Un solo `app/globals.css`**: `styles.css` se movió tal cual (mismas clases BEM, mismos `@keyframes`), sin CSS Modules.
- **Capas de datos casi intactas**: `entities/`, `dtos/`, `mappers/`, `services/` se movieron con cambios mínimos (imports sin extensión `.js`, rutas de `fetch` a `public/`). Lo que tocaba el DOM directamente (`core/render.ts`, `modal.ts`, `favorites.ts`, `filters.ts`, `language.ts`, `animations.ts`, `dom.ts`) se reescribió como hooks/componentes de React.
- **Código vanilla eliminado**: `index.html`, `dist/`, `styles.css` (raíz), `src/core/`, `src/orchestrator/`, `src/cache/`, `src/main.ts` — disponibles en git history si hace falta consultarlos.

## 2. Mapeo módulo viejo → pieza nueva

| Antes (vanilla) | Ahora |
|---|---|
| `src/entities/*` | igual, sin cambios |
| `src/dtos/*` | igual, sin cambios |
| `src/mappers/*` | igual, sin cambios |
| `src/core/data.ts` + `services/Catalog.Service.ts` | fusionados en un solo `services/Catalog.Service.ts` (`core/` ya no existe) |
| `src/services/Reviews.Service.ts` / `Advertisements.Service.ts` | misma lógica; `fetch("reviews.json")` → `fetch("/reviews.json")`, `"banners/*.webp"` → `"/banners/*.webp"` |
| `src/orchestrator/orchestrateServices.ts` | eliminado — reemplazado por `hooks/useCatalog.ts`, `useReviews.ts`, `useAdvertisements.ts` |
| `src/cache/Filter.Cache.ts` | `src/hooks/useGenreFilter.ts` |
| `src/core/dom.ts` | eliminado (React maneja el DOM) |
| `src/core/language.ts` | `src/hooks/useLanguage.tsx` (Context + Provider) |
| `src/core/favorites.ts` | `src/hooks/useFavorites.ts` |
| `src/core/filters.ts` | `src/lib/filterMovies.ts` (texto) + `useMemo` en `SearchBar.tsx` (categorías) |
| `src/core/animations.ts` | `src/lib/animations.ts` (`calculateEntryDelay`); `animateFavorite` reescrito como estado local en `MovieCard.tsx` |
| `src/core/render.ts` | `src/components/MovieCard.tsx` + `MovieGrid.tsx` |
| `src/core/modal.ts` + reseñas del modal en `main.ts` | `src/components/MovieModal.tsx` |
| resto de `main.ts` | `AdsCarousel.tsx`, `Header.tsx`, `SearchBar.tsx`, `Footer.tsx`, `CatalogPage.tsx` |

Ver [MODULOS.md](./MODULOS.md) para el detalle archivo por archivo.

## 3. Dependencias y configuración

`npm install` agregó `next@16`, `react@19`, `react-dom@19` como dependencias, y `typescript@6`, `@types/node`, `@types/react`, `@types/react-dom`, `eslint@9`, `eslint-config-next@16`, `@eslint/eslintrc` como devDependencies. Se sacó `"type": "module"` de `package.json` (Next no lo necesita) y los scripts pasaron a `next dev`/`next build`/`next start`/`eslint`.

`tsconfig.json` se reemplazó por el template de Next (App Router): `jsx: "react-jsx"`, `moduleResolution: "bundler"`, `paths: { "@/*": ["./src/*"] }` — ya no hace falta extensión `.js` en los imports relativos ni el `module: "nodenext"` que exigía la versión anterior.

`eslint.config.mjs` usa el export de flat-config nativo `eslint-config-next/core-web-vitals` (no `FlatCompat`, que con ESLint 9.39 rompía por una estructura circular al cargar `next/core-web-vitals` vía `.extends()`).

`.gitignore` cambió `dist/` por `.next/` + `next-env.d.ts`.

## 4. Detalles no obvios que surgieron durante la implementación

- **`shouldForceFail()` no puede leer `window` a nivel de módulo**: Next intenta prerenderizar `/` en el servidor incluso para una página 100% cliente; si un módulo importado (aunque sea transitivamente) evalúa `window.location.search` en su top-level, el build revienta con `ReferenceError: window is not defined`. Se movió esa lectura adentro de la función `shouldForceFail()` en `Reviews.Service.ts`/`Advertisements.Service.ts`, que solo se ejecuta desde un hook (cliente).
- **Reglas de `react-hooks` v7** (las que trae `eslint-config-next` 16 por defecto) son más estrictas que las clásicas: no dejan hacer `setState` síncrono en el cuerpo de un efecto, ni leer/escribir un ref durante el render. Esto obligó a:
  - Reemplazar el filtrado con un flag manual `isFiltering` por `useTransition()` (React 19 soporta pasarle una función async a `startTransition`).
  - Resetear `category` (al cambiar `language`) y el slide del carrusel (al cambiar `advertisements`) con el patrón de React docs "adjusting state when a prop changes" (comparar contra un `useState` anterior, ajustar durante el render) en vez de un `useEffect` o un ref comparado durante el render.
  - Mover el reset del caché de `useGenreFilter.ts` a un `useEffect` (mutar `.current` de un ref sigue estando permitido, pero no durante el render).
  - Dejar sin tocar (con `eslint-disable-next-line` + comentario) la hidratación de `localStorage` en `useFavorites.ts`/`useLanguage.tsx`, porque ahí el `setState` síncrono dentro del efecto es necesario e intencional (no hay `localStorage` durante SSR).
- **`<img src="">` en el modal cerrado**: como `MovieModal` está siempre montado (para no perder la transición CSS), al principio se le pasaba `src={translated?.image ?? ""}`; React advierte que un `src=""` puede disparar una descarga de la página actual. Se cambió a `src={translated?.image}` (`undefined` en vez de `""`, que React omite como atributo).

## 5. Cómo correr y verificar

```bash
npm install
npm run dev
# abrir http://localhost:3000
```

`npm run build` y `npm run lint` corren limpios. Se verificó manualmente (con un script de Playwright descartado después de usarlo) contra `http://localhost:3000` y `http://localhost:3000/?forceFail=all`:

- [x] Catálogo carga las 30 películas con la animación de entrada escalonada.
- [x] Buscador (debounce) + filtro de categoría, incluida la latencia simulada la primera vez que se elige un género.
- [x] Botón de idioma: traduce estáticos + datos, repuebla categorías, persiste en `localStorage` y sobrevive a un refresh.
- [x] Favoritos: toggle, contador del header, persiste en `localStorage` y sobrevive a un refresh.
- [x] Modal: abre con los datos correctos; cierra con X, click en overlay y Esc.
- [x] Panel de reseñas del modal: visible con reseñas (probado con Matrix, 15 reseñas), oculto sin ellas.
- [x] Carrusel de anuncios: flechas/dots navegan y cambian el slide.
- [x] `?forceFail=all` oculta el carrusel de anuncios (no se monta) y el panel de reseñas del modal (queda `hidden`), sin romper el resto de la página (las 30 cards siguen ahí).
- [x] Sin errores ni warnings en la consola del navegador.
