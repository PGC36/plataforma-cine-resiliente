# AGENTS.md

Guía para agentes de IA (y humanos) que trabajen en este proyecto: catálogo de películas en HTML/CSS/JS vanilla, sin build ni frameworks.

## Qué es esto

Sitio estático (`index.html` + `styles.css` + `js/*.js`) que muestra un catálogo de películas leído desde `peliculas.json`. Incluye: grid responsivo, modal de detalle, favoritos persistidos, buscador + filtro de categoría, y selector de idioma ES/EN.

## Cómo correrlo

No hay build ni dependencias (`node_modules`, `package.json`, etc. no existen — no los agregues sin que se pida). El JS usa módulos ES (`<script type="module">`) y `fetch()`, así que **debe servirse por HTTP**, nunca abrirse con `file://`:

```bash
python3 -m http.server 8123
# abrir http://localhost:8123
```

## Estructura de archivos

```
index.html        Maquetación completa: header (logo + título, contador favoritos, idioma),
                   barra-busqueda (buscador + filtro de categoría, fuera del header),
                   contenedor de cards (vacío, se llena por JS), modal, footer.
styles.css         Todo el CSS. Grid responsivo con auto-fill/minmax, dark theme fijo.
peliculas.json     Fuente de datos. Un array "peliculas" con 30 items.
posters/           Pósters propios de cada película, en formato .webp.
js/
  data.js          fetch() de peliculas.json.
  render.js        Construye las cards del DOM a partir de los datos.
  modal.js         Abre/cierra el modal y lo rellena con los datos de una card.
  favoritos.js      Estado de favoritos en localStorage + contador del header.
  filtros.js       Búsqueda por texto y filtro por categoría.
  idioma.js        Diccionario ES/EN, traducción de textos estáticos y de datos.
  animaciones.js   Lógica de animaciones: retraso escalonado de entrada de las cards
                   y retrigger del pop del botón de favoritos.
  main.js          Orquestador: conecta todo, maneja eventos delegados.
```

## Flujo (cómo se conectan los módulos)

```
                        ┌─────────────┐
                        │  main.js    │  orquestador, único punto de entrada
                        └──────┬──────┘
                               │ iniciar()
       ┌───────────────┬──────┼───────────────┬────────────────┐
       ▼                ▼     ▼                ▼                ▼
   data.js         idioma.js  modal.js     favoritos.js     filtros.js
   fetch JSON      aplicarIdioma()  init listeners  contador     poblarCategorias()
       │            (una vez, al inicio)                          filtrarPeliculas()
       ▼
   peliculas[] (en memoria, dentro de main.js)
       │
       ▼
   render.js → renderizarPeliculas(lista, contenedor)
       │  por cada película: traducirPelicula() (idioma.js) → crea <article class="tarjeta">
       │  con dataset.* (titulo, anio, director, categoria, duracion,
       │  calificacion, descripcion, imagen) — el modal lee estos data-*
       ▼
   contenedor#contenedor-peliculas (delegación de eventos en main.js)
       │
       ├─ click en .tarjeta__favorito → favoritos.alternarFavorito(id) → actualizarContadorFavoritos()
       └─ click en .tarjeta (resto)   → modal.abrirModal(tarjeta.dataset)
```

Eventos disparados por el usuario y su efecto:

| Evento                          | Módulo que reacciona | Efecto |
|----------------------------------|------------------------|--------|
| input en `#buscador`             | `main.js` → `filtros.js` | re-renderiza cards filtradas (con debounce de 300ms) |
| change en `#filtro-categoria`    | `main.js` → `filtros.js` | ídem |
| click en `#boton-idioma`         | `main.js` → `idioma.js`  | traduce textos estáticos, repuebla categorías, re-renderiza cards en el nuevo idioma |
| click en `.tarjeta__favorito`    | `main.js` → `favoritos.js` | toggle en localStorage + actualiza contador |
| click en `.tarjeta` (resto)      | `main.js` → `modal.js`   | abre modal con los datos de esa card |
| click en cerrar / overlay / Esc  | `modal.js`               | cierra modal, restaura scroll del body |

## Convenciones del proyecto

- **Idioma del código**: nombres de variables, funciones y comentarios en español (consistente con el resto del proyecto). Los mensajes de UI usan el diccionario de `idioma.js`, no strings sueltos.
- **Sin dependencias externas**: nada de npm, bundlers ni frameworks. Si hace falta algo nuevo, evaluar primero si se puede resolver con JS/CSS vanilla.
- **Traducción de datos**: `peliculas.json` guarda pares por idioma (`titulo`/`tituloEn`, `categoria`/`categoriaEn`, `descripcion`/`descripcionEn`). Año, director, duración, calificación e imagen son iguales en ambos idiomas. Para leer el campo correcto según idioma, usar siempre `traducirPelicula()` de `idioma.js` — no leer `pelicula.titulo` directamente en código que deba soportar ambos idiomas.
- **Favoritos**: el estado vive en `localStorage` bajo la clave `peliculas-favoritas` (ver `favoritos.js`). No hay backend.
- **Preferencia de idioma**: persiste en `localStorage` bajo `idioma-preferido`.
- **Imágenes**: los pósters están en `posters/`, en formato `.webp`, y el campo `imagen` del JSON apunta a esa ruta relativa (p. ej. `posters/Matrix.webp`). Si se agrega una película nueva, su póster debe seguir la misma convención (archivo `.webp` en `posters/`, nombre sin espacios en PascalCase).
- **Cards con alto fijo**: `.tarjeta` tiene `height` fijo en `styles.css` — si se agregan más datos a la card, cuidar que no rompan el layout (usar `overflow: hidden` / `text-overflow: ellipsis` como ya se hace con el título).
- **Pósters completos, sin recortar**: `.tarjeta__imagen` y `.modal__imagen` usan `object-fit: contain` (no `cover`) para que la portada se vea íntegra, ya que los pósters no comparten todos el mismo aspect ratio. Si se ajusta el alto de la card o del modal, mantener `contain` y un alto uniforme para todas las películas.
- **Logo y título del header**: el `<h1>` usa `<object data="images/titleText.png" type="image/png">Capy Films</object>` — si `titleText.png` no carga, el navegador renderiza el texto "Capy Films" como fallback nativo (sin JS). `.header__titulo-imagen` fuerza `color: #000` + `filter: invert(1)` para que el título se vea blanco tanto con la imagen (negra sobre transparente) como con el texto de fallback. Si se reemplaza `titleText.png`, debe seguir siendo negro sobre fondo transparente para que la inversión funcione. El logo (`images/logo.png`) va a la izquierda del título dentro de `.header__marca`.
- **Header responsive**: `.header` se mantiene siempre en fila (nunca `flex-direction: column`) para que el contador de favoritos y el botón de idioma queden fijos a la derecha del título en cualquier ancho de pantalla. En el media query de 768px solo se reducen tamaños (logo, título, badges), no se apila el layout.
- **Animación de entrada de las cards**: `.tarjeta` anima con `@keyframes tarjeta-aparece` (fade + `translateY`) cada vez que se renderiza, con `animation-delay` escalonado por índice (calculado por `calcularRetrasoEntrada()` en `animaciones.js`, usado desde `render.js`, tope en 15 tarjetas) para el efecto cascada. Respeta `prefers-reduced-motion`. Como `renderizarPeliculas()` se llama en cada re-render (buscador, filtro, cambio de idioma), el buscador tiene un **debounce de 300ms** (`aplicarFiltrosConDelay` en `main.js`) para no re-disparar la animación en cada tecla mientras el usuario escribe. Si se agrega otro input que dispare `aplicarFiltros()` en tiempo real, aplicar el mismo patrón de debounce.
- **Animación del botón de favoritos**: al hacer click en `.tarjeta__favorito`, `animarFavorito()` (`animaciones.js`) fuerza un reflow y reaplica la clase `animar`, que dispara `@keyframes favorito-pop` en `styles.css` (también respeta `prefers-reduced-motion`). Ese reflow es necesario para que la animación se reinicie en clicks consecutivos rápidos sobre la misma card.
- **JS de animaciones centralizado**: toda la lógica de animaciones (retraso de entrada, retrigger del pop de favoritos) vive en `js/animaciones.js`, no inline en `render.js`/`main.js`. Si se agrega una animación nueva disparada desde JS, seguir este mismo patrón: la función que la dispara/calcula va en `animaciones.js` y se importa donde se necesite.

## Al modificar `peliculas.json`

Cada película requiere: `id` (único), `titulo`, `tituloEn`, `anio`, `director`, `categoria`, `categoriaEn`, `duracion`, `calificacion`, `descripcion`, `descripcionEn`, `imagen`. Si falta un campo `*En`, la vista en inglés mostrará `undefined` — no lo dejes vacío.
