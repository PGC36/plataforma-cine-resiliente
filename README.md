# Capy Films 🎬

Catálogo de películas hecho en HTML, CSS y JavaScript vanilla (sin frameworks, sin build).

## Características

- Grid responsivo de películas con póster, categoría, año, director, duración y calificación.
- Buscador por texto y filtro por categoría.
- Modal de detalle con la información completa de cada película.
- Favoritos persistidos en `localStorage`.
- Selector de idioma Español / Inglés.
- Pósters propios en formato `.webp`, mostrados completos (sin recortar) tanto en las cards como en el modal.

## Cómo correrlo

El JS usa módulos ES (`<script type="module">`) y `fetch()`, así que el sitio **debe servirse por HTTP** (no abrir `index.html` directamente con `file://`):

```bash
python3 -m http.server 8123
# abrir http://localhost:8123
```

## Estructura del proyecto

```
index.html          Maquetación: header (logo + título, favoritos, idioma),
                     barra de búsqueda/filtro, banner de anuncios, grid de
                     películas, modal (con panel flotante de reseñas al
                     abrir una película), footer.
styles.css           Todo el CSS del proyecto.
peliculas.json       Fuente de datos (30 películas).
posters/             Pósters de cada película (.webp).
images/              Logo y logotipo de texto del header.
js/
  core/              Módulos originales, sin cambios de lógica:
    data.js          fetch() de peliculas.json.
    render.js        Construye las cards del DOM.
    modal.js         Abre/cierra el modal de detalle.
    favoritos.js     Favoritos en localStorage.
    filtros.js       Búsqueda por texto y filtro por categoría (sobre la
                     lista ya resuelta por género, ver cache/filtroCache.js).
    idioma.js        Diccionario ES/EN y traducción de datos.
    animaciones.js   Retraso de entrada de las cards y pop de favoritos.
  services/          Tres "backends" simulados, consumidos en paralelo:
    catalogoService.js   Envuelve data.js (nunca falla).
    resenasService.js    Reseñas mock por película, con fallo aleatorio simulado.
    anunciosService.js   Anuncios mock, con fallo aleatorio simulado.
  cache/
    filtroCache.js   Closure con caché privado: filtra por género con
                     una simulación de latencia solo en la primera
                     consulta de cada género; las siguientes leen del
                     caché sin volver a disparar la promesa.
  orquestador/
    orquestarServicios.js   Dispara los tres servicios con
                     Promise.allSettled; el catálogo es obligatorio,
                     reseñas y anuncios son opcionales (si fallan, la
                     UI sigue funcionando sin ellos).
  main.js            Orquestador de la app: arranca orquestarServicios(),
                     crea el filtro por género y conecta los eventos.
```

Para forzar en vivo el fallo de un servicio secundario (útil para demostrarlo sin depender del azar), agregar `?forzarFallo=resenas`, `?forzarFallo=anuncios` o `?forzarFallo=todos` a la URL.

## Contribuir

Para más detalle sobre convenciones del proyecto (formato de imágenes, estructura de `peliculas.json`, flujo entre módulos, etc.), ver [AGENTS.md](./AGENTS.md). Para el detalle archivo por archivo de cada módulo y servicio (responsabilidad, exports, imports), ver [MODULOS.md](./MODULOS.md).
