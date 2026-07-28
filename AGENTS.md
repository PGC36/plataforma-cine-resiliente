# AGENTS.md

Guía para agentes de IA (y humanos) que trabajen en este proyecto: catálogo de películas en HTML/CSS/JS vanilla, sin build ni frameworks.

## Qué es esto

Sitio estático (`index.html` + `styles.css` + `js/*.js`) que muestra un catálogo de películas leído desde `peliculas.json`. Incluye: grid responsivo, modal de detalle, favoritos persistidos, buscador + filtro de categoría, selector de idioma ES/EN, orquestación concurrente de servicios simulados (catálogo/reseñas/anuncios) y un caché de filtrado por género con closure.

Para el detalle archivo por archivo de cada módulo y servicio (responsabilidad, exports, imports, lógica interna), ver [MODULOS.md](./MODULOS.md).

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
                   banner de anuncios (#seccion-anuncios, oculto si el servicio falla),
                   contenedor de cards (vacío, se llena por JS),
                   modal + panel flotante de reseñas (#modal-resenas, al lado del
                   modal, oculto si el servicio falló o la película no tiene reseñas),
                   footer.
styles.css         Todo el CSS. Grid responsivo con auto-fill/minmax, dark theme fijo.
peliculas.json     Fuente de datos. Un array "peliculas" con 30 items.
resenas.json       Reseñas mock. Un array "resenas" con 187 items ({ peliculaId,
                   autor, comentario, puntuacion }), fetched por resenasService.js.
posters/           Pósters propios de cada película, en formato .webp.
js/
  core/            Módulos originales, no se reescriben:
    data.js          fetch() de peliculas.json.
    render.js        Construye las cards del DOM a partir de los datos.
    modal.js         Abre/cierra el modal y lo rellena con los datos de una card.
    favoritos.js     Estado de favoritos en localStorage + contador del header.
    filtros.js       Búsqueda por texto y filtro por categoría. Recibe siempre
                     "todas" como categoría desde main.js, porque el filtro por
                     género real ya lo resolvió cache/filtroCache.js antes —
                     evita el doble filtrado por categoría (ver más abajo).
    idioma.js        Diccionario ES/EN, traducción de textos estáticos y de datos.
    animaciones.js   Lógica de animaciones: retraso escalonado de entrada de las cards
                     y retrigger del pop del botón de favoritos.
  services/        Tres "backends" simulados, pensados para consumirse en paralelo:
    catalogoService.js   Wrapper de data.js. Nunca falla a propósito.
    resenasService.js    fetch() de resenas.json (187 reseñas, ver ../resenas.json),
                         filtrado por peliculaId (id) desde main.js al abrir el
                         modal. Falla con probabilidad aleatoria simulada, o de
                         forma forzada vía ?forzarFallo=resenas (o "todos") —
                         en ese caso ni siquiera llega a pedir el JSON.
    anunciosService.js   Anuncios mock. Mismo patrón que resenasService.js,
                         con ?forzarFallo=anuncios (o "todos"), independiente entre sí.
  cache/
    filtroCache.js   crearFiltroPeliculas(peliculas) devuelve un objeto con
                     filtrarPorGenero(genero), que encapsula un caché privado
                     por closure. Cachea por categoría canónica (el campo ES
                     categoria de cada película), no por el texto que muestra
                     el <select> — así el caché no se invalida al cambiar de
                     idioma (ver "Convenciones" para el detalle del bug que evita).
  orquestador/
    orquestarServicios.js   Promise.allSettled sobre los tres services.
                           Si el catálogo falla, propaga el error (fatal).
                           Si reseñas o anuncios fallan, devuelve null para
                           esa parte sin romper el resto.
  main.js          Orquestador: llama a orquestarServicios(), crea el filtro
                   de género, conecta todos los eventos delegados.
```

## Flujo (cómo se conectan los módulos)

```
                        ┌─────────────┐
                        │  main.js    │  orquestador, único punto de entrada
                        └──────┬──────┘
                               │ iniciar()
                               ▼
                  orquestarServicios() ──── Promise.allSettled ────┐
                               │                                    │
          ┌────────────────────┼────────────────────┐              │
          ▼                    ▼                     ▼             │
   catalogoService.js   resenasService.js     anunciosService.js    │
   (data.js, nunca      (mock, falla          (mock, falla          │
    falla)                aleatorio/forzado)    aleatorio/forzado)  │
          │                    │                     │              │
          ▼                    ▼                     ▼              │
   { peliculas, resenas: null si falló, anuncios: null si falló } ◄──┘
       │
       ├─ anuncios (si no es null) → pinta #seccion-anuncios
       ├─ resenas guardado en memoria (main.js), se filtra por película recién al abrir el modal
       │
       ▼
   peliculas[] (en memoria, dentro de main.js)
       │
       ├──────────────┬──────────────┐
       ▼               ▼              ▼
   idioma.js        modal.js     favoritos.js
   aplicarIdioma()  init listeners  contador
   (una vez, al inicio)
       │
       ▼
   crearFiltroPeliculas(peliculas) → filtroPeliculas (cache/filtroCache.js)
       │  guarda un caché privado por closure, keyed por categoría canónica (ES)
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
                                         + main.js filtra `resenas` por peliculaId
                                           y pinta #modal-resenas (o lo deja oculto
                                           si el servicio falló o no hay reseñas
                                           para esa película — el modal se comporta
                                           igual que siempre en ese caso)
```

Filtrado (`aplicarFiltros()` en `main.js`, ahora async):

1. `await filtroPeliculas.filtrarPorGenero(filtroCategoria.value)` → resuelve el género vía caché (instantáneo) o vía la simulación de latencia (primera vez para ese género), en cualquier idioma. Mientras está en vuelo, `#filtro-categoria` se deshabilita para evitar condiciones de carrera entre géneros.
2. El resultado se pasa a `filtrarPeliculas(resultado, buscador.value, "todas")` de `filtros.js` (sin cambios) — se le fuerza `"todas"` como categoría porque el género ya fue resuelto en el paso 1, evitando el doble filtrado.
3. `renderizarPeliculas()` pinta el resultado final.

Eventos disparados por el usuario y su efecto:

| Evento                          | Módulo que reacciona | Efecto |
|----------------------------------|------------------------|--------|
| input en `#buscador`             | `main.js` → `cache/filtroCache.js` → `filtros.js` | re-renderiza cards filtradas (con debounce de 300ms) |
| change en `#filtro-categoria`    | `main.js` → `cache/filtroCache.js` → `filtros.js` | ídem; deshabilita el select mientras resuelve el género |
| click en `#boton-idioma`         | `main.js` → `idioma.js`  | traduce textos estáticos, repuebla categorías, re-renderiza cards en el nuevo idioma |
| click en `.tarjeta__favorito`    | `main.js` → `favoritos.js` | toggle en localStorage + actualiza contador |
| click en `.tarjeta` (resto)      | `main.js` → `modal.js` + `main.js` (`#modal-resenas`) | abre modal con los datos de esa card y pinta sus reseñas (si hay) al lado |
| click en cerrar / overlay / Esc  | `modal.js`               | cierra modal (y con él, `#modal-resenas`, que es hijo del mismo overlay), restaura scroll del body |

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
- **JS de animaciones centralizado**: toda la lógica de animaciones (retraso de entrada, retrigger del pop de favoritos) vive en `js/core/animaciones.js`, no inline en `render.js`/`main.js`. Si se agrega una animación nueva disparada desde JS, seguir este mismo patrón: la función que la dispara/calcula va en `animaciones.js` y se importa donde se necesite.
- **`core/` no se reescribe**: los módulos de `js/core/` son el código original del live coding. Cambios de integración (nuevos parámetros, nuevas llamadas) se hacen desde quien los consume (`main.js`, `cache/filtroCache.js`), no editando su lógica interna, salvo que se detecte un bug real en ellos.
- **Servicios simulados independientes entre sí**: `resenasService.js` y `anunciosService.js` tienen su propia probabilidad de fallo y su propio delay — no comparten estado ni deben fallar "en bloque", para que se note que son fallas independientes. `catalogoService.js` nunca falla a propósito: es el único dato indispensable para renderizar.
- **Fallo forzado para demos/grabaciones**: el query param `?forzarFallo=resenas|anuncios|todos` salta el `Math.random()` y fuerza el rechazo del/los servicio(s) indicado(s), sin afectar el comportamiento aleatorio normal cuando el parámetro no está presente. Usar esto para mostrar el fallo en vivo sin depender de la suerte.
- **`orquestarServicios()` es el único punto que llama a `Promise.allSettled`**: si el catálogo falla, propaga el error (lo atrapa el `catch` de `iniciar()` en `main.js`, que ya muestra el mensaje de error traducido). Si reseñas o anuncios fallan, se resuelven como `null` — nunca deben tumbar el render del catálogo.
- **Reseñas ligadas a la película abierta, no una sección global**: `resenasService.js` devuelve todas las reseñas mock (con su `peliculaId`); `main.js` las guarda tal cual en memoria y recién las filtra por `peliculaId` cuando se abre el modal (`renderizarResenasModal`), pintando `#modal-resenas` como panel flotante al lado del `.modal` (mismo `#modal-overlay`, por eso se abre/cierra junto con el modal sin tocar `modal.js`). Si el servicio falló (`resenas === null`) o la película no tiene reseñas, `#modal-resenas` queda oculto (`display: none`, no ocupa espacio) y el modal se centra solo, exactamente igual que antes de esta función. `#modal-resenas` tiene `overflow-y: auto` con `max-height` fija — si una película llega a tener muchas reseñas, se scrollea en vez de estirar el modal.
- **Estética "flotante" de las reseñas del modal**: `#modal-resenas` en sí es transparente (sin fondo/borde/sombra) — el efecto visual vive en cada `.modal-resenas__item`: sombra propia, rotación leve alternada (impar/par, enderezada al hover) y animación de entrada (`@keyframes resena-flota` en `styles.css`) con delay escalonado por índice, reutilizando `calcularRetrasoEntrada()` de `animaciones.js` (mismo helper que ya usan las cards del grid, no se creó uno nuevo). Si se agregan más reseñas mock, no hace falta tocar el CSS ni el JS: el `nth-child` y el índice del `.map()` en `main.js` escalan solos.
- **Scrollbar de `#modal-resenas` con la paleta del sitio**: por defecto el navegador dibuja el scroll con los colores del sistema (gris claro), que desentona contra el dark theme. Se sobreescribe con `scrollbar-width`/`scrollbar-color` (Firefox) y los pseudo-elementos `::-webkit-scrollbar*` (Chrome/Edge/Safari): pista transparente y "thumb" en `--color-primario` (con un tono más claro al hover). Si se agrega scroll a otro contenedor nuevo, replicar este mismo patrón en vez de dejar el scrollbar por defecto del navegador.
- **Caché de género por closure (`cache/filtroCache.js`)**: el caché se indexa por la categoría canónica en español (`pelicula.categoria`), nunca por el texto que muestra el `<select>` (que cambia con el idioma: "Acción" vs "Action"). Esto es intencional — cachear por el string del select rompería el caché al cambiar de idioma. Si se toca este archivo, mantener esa indirección (mapa `categoria`/`categoriaEn` → clave canónica).
- **Sin doble filtrado por categoría**: `main.js` siempre le pasa `"todas"` como categoría a `filtrarPeliculas()` de `filtros.js`, porque el filtro por género ya lo resolvió `filtroCache.js` antes. No cambiar esto sin ajustar también `filtroCache.js` — si ambos filtran por categoría, se duplica trabajo (aunque el resultado final sea el mismo).
- **`.oculto` usa `!important` a propósito**: es la utilidad genérica para "ocultar del todo" (`#seccion-anuncios`, `#modal-resenas`). Sin `!important`, cualquier regla futura que declare `display` sobre ese mismo elemento (como `.anuncios { display: flex; }` o `.modal-resenas { display: flex; }`) le gana a `.oculto` por orden de aparición en el archivo aunque tengan la misma especificidad — eso pasó realmente: con `#modal-resenas` sin reseñas, quedaba como caja vacía ocupando espacio en el `flex` del `#modal-overlay` y corría el modal hacia la izquierda en vez de dejarlo centrado. Si se agrega un nuevo elemento que se oculte con `.oculto` y también declare su propio `display`, no hace falta nada más — `!important` ya lo cubre.

## Al modificar `peliculas.json`

Cada película requiere: `id` (único), `titulo`, `tituloEn`, `anio`, `director`, `categoria`, `categoriaEn`, `duracion`, `calificacion`, `descripcion`, `descripcionEn`, `imagen`. Si falta un campo `*En`, la vista en inglés mostrará `undefined` — no lo dejes vacío.
