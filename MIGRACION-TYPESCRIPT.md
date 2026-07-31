    # Migración a TypeScript — 2026-07-30

Registro de la migración del código JS vanilla del catálogo de películas a TypeScript, con arquitectura en capas (DTOs / mappers / entities), realizada para el Laboratorio 3 ("Inicialización Corporativa y Migración Arquitectónica por Capas"). Mantiene la arquitectura de módulos documentada en [AGENTS.md](./AGENTS.md) y [MODULOS.md](./MODULOS.md); esto es un registro de **qué cambió y por qué**, no la reemplaza.

## 1. `tsconfig.json`

Ya existía un `tsconfig.json` base en el repo; se ajustó (no se regeneró desde cero) para cumplir la consigna sin perder la configuración pensada para un sitio estático servido sin bundler:

- `"rootDir": "src"`, `"outDir": "dist"` — todo el `.ts` vive bajo `src/` (`src/core/`, `src/services/`, `src/cache/`, `src/orquestador/`, `src/entities/`, `src/dtos/`, `src/mappers/`, `src/main.ts`) y se compila a `dist/` con la misma estructura interna, sin el prefijo `src/`. El código fuente nunca se mezcla con el compilado.
- `"strict": true`, `"noImplicitAny": true`, `"noEmitOnError": true` — agregadas explícitamente por consigna (`strict` ya implicaba `noImplicitAny`, pero se dejó explícito).
- Se mantuvo `"module": "nodenext"`, que exige extensión `.js` en los imports relativos — coincide con lo que ya necesita un `<script type="module">` nativo sin bundler, así que **ningún import cambió de forma** (`from "./core/data.js"` sigue apuntando, en runtime, al `.js` compilado).
- Se sacó `"jsx": "react-jsx"` (residual del template, no aplica — no hay React).

`package.json` suma el script `"build": "tsc"` y `"type": "module"`. Este último es necesario, no cosmético: con `"module": "nodenext"`, TypeScript decide si cada `.ts` es ESM o CommonJS mirando el campo `"type"` de `package.json` (igual que lo haría Node en runtime). Sin él, asumía CommonJS por default y rechazaba la sintaxis `import`/`export` bajo `verbatimModuleSyntax` (errores `TS1287`/`TS1295`, uno por cada `import`/`export` del proyecto). Con `"type": "module"`, coincide con lo que ya es cierto en runtime — el sitio corre como ES modules nativos vía `<script type="module">`.

## 2. Extensiones migradas

Los 13 `.js` de `js/` se convirtieron a `.ts` en el mismo lugar (mismos nombres, mismas carpetas): `js/core/{data,render,modal,favoritos,filtros,idioma,animaciones}.ts`, `js/services/{catalogoService,resenasService,anunciosService}.ts`, `js/cache/filtroCache.ts`, `js/orquestador/orquestarServicios.ts`, `js/main.ts`. Sin cambios de lógica salvo los fixes de tipado del punto 4.

Se agregó un archivo nuevo, `js/core/dom.ts`, con un único helper (`obtenerElemento`) para no repetir el chequeo de `null` de `document.getElementById` en cada módulo — es la única pieza de código nueva dentro de `core/`.

Luego, en un segundo paso, todo el árbol de fuente (`js/`, `entities/`, `dtos/`, `mappers/`) se movió tal cual — mismos nombres, mismas rutas relativas internas — bajo una carpeta `src/`, para separar explícitamente fuente (`src/`) de compilado (`dist/`). Ningún import interno cambió: al ser todos relativos (`./`, `../`, `../../`), la posición relativa entre archivos es idéntica a la de antes de mover la carpeta.

## 3. Capas nuevas: `entities/`, `dtos/`, `mappers/`

Los "tres endpoints concurrentes" que orquesta `orquestarServicios()` (catálogo, reseñas, anuncios) ahora tienen su forma cruda separada de su forma de dominio:

| Endpoint | DTO (forma cruda) | Entity (forma de dominio) | Mapper |
|---|---|---|---|
| `peliculas.json` | `src/dtos/Pelicula.DTO.ts` + `PeliculasResponse.DTO.ts` (envelope) | `src/entities/Pelicula.ts` | `src/mappers/peliculaMapper.ts` |
| `resenas.json` | `src/dtos/Resena.DTO.ts` + `ResenasResponse.DTO.ts` (envelope) | `src/entities/Resena.ts` | `src/mappers/resenaMapper.ts` |
| Mock de anuncios | `src/dtos/Anuncio.DTO.ts` | `src/entities/Anuncio.ts` | `src/mappers/anuncioMapper.ts` |

Los mappers son funciones puras (sin DOM, sin fetch, sin side effects) que convierten `DTO → Entity`. Se insertan en la capa de servicios, justo después del fetch/mock crudo:

- `src/core/data.ts` hace el `fetch` y devuelve `PeliculaDTO[]` (crudo, sin tocar).
- `src/services/catalogoService.ts` llama a `mapPeliculasDtoToEntities` y devuelve `Pelicula[]` ya saneado.
- Mismo patrón en `resenasService.ts` (mapea después del `fetch` de `resenas.json`) y `anunciosService.ts` (mapea el array mock antes de resolverlo).

`core/render.ts`, `core/filtros.ts`, `core/idioma.ts`, `cache/filtroCache.ts` y `main.ts` trabajan **solo con entities**, nunca ven un DTO — la separación de capas es real, no solo nominal.

`peliculaMapper.ts` de paso resuelve un bug latente que ya documentaba `AGENTS.md`: si `peliculas.json` no trae `tituloEn`/`categoriaEn`/`descripcionEn`, el mapper cae al valor en español (`dto.tituloEn ?? dto.titulo`) en vez de dejar pasar `undefined` hasta el DOM.

## 4. Resolución de errores de tipado (`strict` + `noImplicitAny`)

Fixes puntuales que pidió el compilador, sin tocar lógica de negocio:

- **DOM posiblemente `null`**: todo `document.getElementById(...)` en `modal.ts` y `main.ts` pasa por `obtenerElemento()` (`core/dom.ts`), que tira un error explícito si el id no existe en vez de dejar pasar `HTMLElement | null`.
- **`EventTarget` sin `.closest`**: en `main.ts`, los handlers de click castean `evento.target as HTMLElement` antes de usar `.closest(...)`.
- **`dataset` es `string`, no `number`**: en `render.ts`, los campos numéricos (`id`, `anio`, `duracion`, `calificacion`) se asignan a `dataset.*` con `String(...)` explícito.
- **`dataset` puede venir `undefined`**: en `modal.ts`, `abrirModal(datos: DOMStringMap)` usa `?? ""` en cada campo destructurado (el HTML garantiza que estén, pero el tipo `DOMStringMap` no lo sabe).
- **Arrays con `noUncheckedIndexedAccess`**: `anuncios[indiceAnuncioActual]` en `main.ts` ahora es `Anuncio | undefined`; se agregó un guard (`if (!anuncio) return`) antes de pintarlo.
- **`localStorage`/`JSON.parse` sin tipar**: `favoritos.ts` tipa el `Set` como `Set<number>` y castea el `JSON.parse` de vuelta a `number[]`.
- **Diccionario de idioma**: `idioma.ts` define `type Idioma = "es" | "en"` y una interfaz `Traduccion` con sus claves; `traducirPelicula` ahora tipa explícitamente que recibe y devuelve una `Pelicula` (entity).

Ninguno de estos cambios altera el comportamiento en runtime — son anotaciones, castings o guards que hacen explícito lo que el JS original asumía implícitamente.

## 5. Cómo compilar y correr

```bash
npx tsc              # o: npm run build — genera/actualiza dist/, hay que correrlo después de cada cambio en src/
python3 -m http.server 8123
# abrir http://localhost:8123
```

`index.html` apunta a `dist/main.js`. Es el único cambio de `index.html` fuera de `src/`. `dist/` y `node_modules/` están en `.gitignore`: `dist/` es 100% generado por `tsc`, nunca se versiona. Si `dist/` tiene contenido de una estructura anterior (por ejemplo, un `dist/js/` que ya no corresponde), conviene borrar la carpeta entera (`rm -rf dist`) antes de recompilar para no confundir archivos viejos con los nuevos.

## 6. Checklist de validación (criterio del catedrático)

- [ ] `npx tsc` compila con **cero errores** en consola (pendiente — restricción: no se ejecutó desde este agente, según lo pedido).
- [ ] Se genera el árbol `dist/` reflejando `src/core/`, `src/services/`, `src/cache/`, `src/orquestador/`, `src/entities/`, `src/dtos/`, `src/mappers/`, `main.js` (sin el prefijo `src/`).
- [ ] La app sirve igual que antes desde `dist/main.js`: catálogo, buscador/filtro, favoritos, modal + reseñas, carrusel de anuncios, `?forzarFallo=resenas|anuncios|todos`.

## 7. Reestructuración posterior: aplanado de `js/` y renombre de DTOs

Dos ajustes hechos después de la migración inicial, ya reflejados arriba:

- **Se eliminó el nivel `js/` dentro de `src/`**: `src/js/core/`, `src/js/services/`, `src/js/cache/`, `src/js/orquestador/` y `src/js/main.ts` pasaron a `src/core/`, `src/services/`, `src/cache/`, `src/orquestador/` y `src/main.ts`, directamente al mismo nivel que `src/entities/`, `src/dtos/` y `src/mappers/`. Como resultado, `dist/main.js` reemplaza a `dist/js/main.js` — se actualizó `index.html` acorde. De paso se corrigió un import que había quedado con un nivel de más (`src/cache/filtroCache.ts` apuntaba a `../../entities/Pelicula.js`, debía ser `../entities/Pelicula.js`).
- **DTOs renombrados** al patrón `Nombre.DTO.ts`: `PeliculaDTO.ts` → `Pelicula.DTO.ts`, `ResenaDTO.ts` → `Resena.DTO.ts`, `AnuncioDTO.ts` → `Anuncio.DTO.ts`, `PeliculasResponseDTO.ts` → `PeliculasResponse.DTO.ts`, `ResenasResponseDTO.ts` → `ResenasResponse.DTO.ts`. Solo cambió el nombre de archivo; los identificadores exportados (`PeliculaDTO`, `ResenaDTO`, etc.) se mantuvieron igual.

## 8. Nombres de archivo traducidos a inglés

Todos los nombres de archivo `.ts` bajo `src/` (salvo `main.ts`, `data.ts`, `dom.ts`, `modal.ts`, `render.ts`, que ya estaban en inglés) se tradujeron:

| Antes | Ahora |
|---|---|
| `core/animaciones.ts` | `core/animations.ts` |
| `core/favoritos.ts` | `core/favorites.ts` |
| `core/filtros.ts` | `core/filters.ts` |
| `core/idioma.ts` | `core/language.ts` |
| `services/anunciosService.ts` | `services/advertisementsService.ts` |
| `services/catalogoService.ts` | `services/catalogService.ts` |
| `services/resenasService.ts` | `services/reviewsService.ts` |
| `cache/filtroCache.ts` | `cache/filterCache.ts` |
| `orquestador/orquestarServicios.ts` | `orquestador/orchestrateServices.ts` |
| `entities/Anuncio.ts` | `entities/Advertisement.ts` |
| `entities/Pelicula.ts` | `entities/Movie.ts` |
| `entities/Resena.ts` | `entities/Review.ts` |
| `dtos/Anuncio.DTO.ts` | `dtos/Advertisement.DTO.ts` |
| `dtos/Pelicula.DTO.ts` | `dtos/Movie.DTO.ts` |
| `dtos/Resena.DTO.ts` | `dtos/Review.DTO.ts` |
| `dtos/PeliculasResponse.DTO.ts` | `dtos/MoviesResponse.DTO.ts` |
| `dtos/ResenasResponse.DTO.ts` | `dtos/ReviewsResponse.DTO.ts` |
| `mappers/anuncioMapper.ts` | `mappers/advertisementMapper.ts` |
| `mappers/peliculaMapper.ts` | `mappers/movieMapper.ts` |
| `mappers/resenaMapper.ts` | `mappers/reviewMapper.ts` |

Alcance deliberadamente limitado a **nombres de archivo**: las carpetas contenedoras (`core/`, `services/`, `cache/`, `orquestador/`, `entities/`, `dtos/`, `mappers/`) y todos los identificadores internos (funciones, variables, interfaces exportadas como `PeliculaDTO`, `crearFiltroPeliculas`, `obtenerAnuncios`, etc.) se mantuvieron en español, sin tocar, respetando la convención de `AGENTS.md` ("nombres de variables, funciones y comentarios en español"). Como consecuencia, hay archivos cuyo nombre está en inglés pero cuyo contenido sigue en español (p. ej. `movieMapper.ts` exporta `mapPeliculaDtoToEntity`) — es intencional, no una inconsistencia a corregir.

Todos los `import` que referenciaban los nombres viejos se actualizaron (verificado con grep, sin referencias colgantes).

## Nota sobre docs existentes

`AGENTS.md` y `README.md` todavía dicen "no hay build ni dependencias" — eso ya no es cierto después de esta migración (hay un paso de compilación con `tsc` antes de servir). No se editaron en este cambio porque no fue parte de lo pedido; conviene actualizarlos en un commit aparte para que no queden desalineados con el estado real del proyecto.
