# Capy Films 🎬

Catálogo de películas hecho en HTML, CSS y TypeScript (sin frameworks, sin bundler — solo `tsc` para compilar).

## Características

- Grid responsivo de películas con póster, categoría, año, director, duración y calificación.
- Buscador por texto y filtro por categoría.
- Modal de detalle con la información completa de cada película.
- Favoritos persistidos en `localStorage`.
- Selector de idioma Español / Inglés.
- Pósters propios en formato `.webp`, mostrados completos (sin recortar) tanto en las cards como en el modal.
- Arquitectura en capas (DTO → mapper → entity) que sanea los datos crudos antes de que lleguen a la UI.

## Cómo correrlo

Hay un paso de compilación con TypeScript (`tsc`), sin bundler — necesita Node/npm solo para eso:

```bash
npm install          # una vez, instala typescript
npx tsc               # compila src/*.ts → dist/*.js (o: npm run build)
python3 -m http.server 8123
# abrir http://localhost:8123
```

`index.html` carga `dist/main.js` como módulo ES (`<script type="module">`) y usa `fetch()`, así que el sitio **debe servirse por HTTP** (no abrir `index.html` directamente con `file://`). Hay que recompilar (`npx tsc`) después de cada cambio en `src/`.

## Estructura del proyecto

```
index.html           Maquetación: header (logo + título, favoritos, idioma),
                      banner de anuncios / carrusel, barra de búsqueda/filtro,
                      grid de películas, modal (con panel flotante de reseñas al
                      abrir una película), footer.
styles.css            Todo el CSS del proyecto.
movies.json           Fuente de datos (30 películas, claves en inglés).
reviews.json          Reseñas mock (187 items), fetched por Reviews.Service.ts.
posters/              Pósters de cada película (.webp).
banners/              Imágenes de fondo del carrusel de anuncios (.webp, 1600x500).
images/               Logo y logotipo de texto del header.
tsconfig.json         Config de TypeScript (rootDir "src", outDir "dist", strict).
src/
  entities/           Modelo de dominio: Movie, Review, Advertisement.
  dtos/               Forma cruda de cada endpoint antes de mapear.
  mappers/            Funciones puras DTO → Entity.
  core/               Módulos originales, sin cambios de lógica:
    data.ts             fetch() de movies.json.
    render.ts           Construye las cards del DOM.
    modal.ts            Abre/cierra el modal de detalle.
    favorites.ts        Favoritos en localStorage.
    filters.ts          Búsqueda por texto y filtro por categoría (sobre la
                        lista ya resuelta por género, ver cache/Filter.Cache.ts).
    language.ts         Diccionario ES/EN y traducción de datos.
    animations.ts       Retraso de entrada de las cards y pop de favoritos.
    dom.ts               Helper para tipar getElementById.
  services/           Tres "backends" simulados, consumidos en paralelo:
    Catalog.Service.ts          Envuelve data.ts + mapper (nunca falla).
    Reviews.Service.ts          Reseñas mock por película, con fallo simulado.
    Advertisements.Service.ts   Anuncios mock (carrusel/hero banner, ver banners/),
                               con fallo simulado.
  cache/
    Filter.Cache.ts      Closure con caché privado: filtra por género con
                        una simulación de latencia solo en la primera
                        consulta de cada género; las siguientes leen del
                        caché sin volver a disparar la promesa.
  orchestrator/
    orchestrateServices.ts   Dispara los tres servicios con
                        Promise.allSettled; el catálogo es obligatorio,
                        reseñas y anuncios son opcionales (si fallan, la
                        UI sigue funcionando sin ellos).
  main.ts              Punto de entrada de la app: arranca orchestrateServices(),
                        crea el filtro por género y conecta los eventos.
```

Para forzar en vivo el fallo de un servicio secundario (útil para demostrarlo sin depender del azar), agregar `?forceFail=reviews`, `?forceFail=advertisements` o `?forceFail=all` a la URL.

## Contribuir

Para más detalle sobre convenciones del proyecto (formato de imágenes, estructura de `movies.json`, flujo entre módulos, etc.), ver [AGENTS.md](./AGENTS.md). Para el detalle archivo por archivo de cada módulo y servicio (responsabilidad, exports, imports), ver [MODULOS.md](./MODULOS.md). Para el historial de la migración de JS vanilla a TypeScript, ver [MIGRACION-TYPESCRIPT.md](./MIGRACION-TYPESCRIPT.md).
