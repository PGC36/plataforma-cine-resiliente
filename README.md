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
index.html        Maquetación: header (logo + título, favoritos, idioma),
                   barra de búsqueda/filtro, grid de películas, modal, footer.
styles.css         Todo el CSS del proyecto.
peliculas.json     Fuente de datos (30 películas).
posters/           Pósters de cada película (.webp).
images/            Logo y logotipo de texto del header.
js/
  animaciones-js   Crea animaciones.
  data.js          fetch() de peliculas.json.
  render.js        Construye las cards del DOM.
  modal.js         Abre/cierra el modal de detalle.
  favoritos.js      Favoritos en localStorage.
  filtros.js       Búsqueda y filtro por categoría.
  idioma.js        Diccionario ES/EN y traducción de datos.
  main.js          Orquestador de la app.
```

## Contribuir

Para más detalle sobre convenciones del proyecto (formato de imágenes, estructura de `peliculas.json`, flujo entre módulos, etc.), ver [AGENTS.md](./AGENTS.md).
