# Módulos y servicios

Detalle de cada archivo JS del proyecto: responsabilidad, qué expone (`export`) y de qué depende (`import`). Para el flujo completo entre módulos y las convenciones generales, ver [AGENTS.md](./AGENTS.md).

## `js/core/` — módulos originales (no se reescriben)

### `data.js`
- **Responsabilidad:** `fetch()` de `peliculas.json`.
- **Exports:** `obtenerPeliculas(): Promise<Pelicula[]>` — lanza error si la respuesta no es `ok`.
- **Imports:** ninguno.

### `render.js`
- **Responsabilidad:** construir las cards del DOM a partir de una lista de películas.
- **Exports:** `renderizarPeliculas(peliculas, contenedor): void`.
- **Imports:** `esFavorito` (`favoritos.js`), `obtenerTraduccion`/`traducirPelicula` (`idioma.js`), `calcularRetrasoEntrada` (`animaciones.js`).
- **Nota:** traduce cada película en el momento de pintar (`traducirPelicula`), no antes — por eso el caché de género (`cache/filtroCache.js`) puede guardar objetos sin traducir sin que se rompa nada.

### `modal.js`
- **Responsabilidad:** abrir/cerrar el modal de detalle y rellenarlo con los `data-*` de una card.
- **Exports:** `abrirModal(datos)`, `cerrarModal()`, `inicializarModal()`.
- **Imports:** ninguno.

### `favoritos.js`
- **Responsabilidad:** estado de favoritos en `localStorage` (clave `peliculas-favoritas`) y contador del header.
- **Exports:** `esFavorito(id)`, `alternarFavorito(id)`, `contarFavoritos()`, `actualizarContadorFavoritos()`.
- **Imports:** ninguno.

### `filtros.js`
- **Responsabilidad:** poblar el `<select>` de categorías y filtrar por texto + categoría.
- **Exports:** `poblarCategorias(peliculas, selectElemento)`, `filtrarPeliculas(peliculas, texto, categoria)`.
- **Imports:** `traducirPelicula` (`idioma.js`).
- **Nota de integración:** `main.js` siempre le pasa `"todas"` como `categoria`, porque el filtro por género real ya lo resolvió `cache/filtroCache.js` antes de llegar acá — evita el doble filtrado (ver sección de la caché más abajo).

### `idioma.js`
- **Responsabilidad:** diccionario ES/EN y traducción de textos estáticos y de datos.
- **Exports:** `obtenerIdioma()`, `obtenerTraduccion(clave)`, `establecerIdioma(idioma)`, `traducirPelicula(pelicula)`, `aplicarIdioma()`.
- **Imports:** ninguno.
- **Persistencia:** `localStorage` bajo `idioma-preferido`.

### `animaciones.js`
- **Responsabilidad:** retraso escalonado de entrada de las cards y retrigger del pop de favoritos.
- **Exports:** `calcularRetrasoEntrada(indice)`, `animarFavorito(boton)`.
- **Imports:** ninguno.

---

## `js/services/` — tres "backends" simulados, pensados para `Promise.allSettled`

### `catalogoService.js`
- **Responsabilidad:** exponer el catálogo con la misma interfaz que los otros dos servicios, delegando en `data.js`. Nunca falla a propósito.
- **Exports:** `obtenerCatalogo(): Promise<Pelicula[]>`.
- **Imports:** `obtenerPeliculas` (`../core/data.js`).
- **Lógica:** wrapper directo, sin `try/catch` propio — si el `fetch` real falla, el rechazo se propaga tal cual.

### `resenasService.js`
- **Responsabilidad:** simular un servicio externo de reseñas de usuarios, con fallo aleatorio o forzado.
- **Exports:** `obtenerResenas(): Promise<Resena[]>`.
- **Imports:** ninguno (hace su propio `fetch()` de `resenas.json`, igual que `core/data.js` hace con `peliculas.json`).
- **Parámetros de simulación:** `DELAY_MS = 700`, `PROBABILIDAD_FALLO = 0.3`. Primero se cumple el delay/fallo simulado (`setTimeout`); solo si no le tocó fallar, recién ahí dispara el `fetch()` real de `resenas.json`.
- **Fallo forzado:** `?forzarFallo=resenas` o `?forzarFallo=todos` en la URL saltea el `Math.random()` y siempre rechaza (sin llegar a pedir el JSON).
- **Fuente de datos (`resenas.json`, raíz del proyecto):** `{ "resenas": [{ peliculaId, autor, comentario, puntuacion }, ...] }`, 187 reseñas repartidas sobre las 30 películas de `peliculas.json` con esta distribución (pedida explícitamente, no arbitraria): 3 películas (10%) con más de 10 reseñas — incluye Matrix (id 2) con 15, a propósito para poder demostrar el scroll de `#modal-resenas` —, 9 (30%) con exactamente 9, 9 (30%) entre 5 y 8, 4 (15%, redondeando 4.5 hacia abajo) entre 1 y 4, y 5 (15%, redondeando hacia arriba) sin ninguna reseña. `main.js` consume el array completo tal cual y filtra por `peliculaId` recién al abrir el modal de una película (no hay un mapeo previo por género/categoría). Si se agregan películas nuevas a `peliculas.json`, `resenas.json` no se actualiza solo — hay que sumarle sus reseñas a mano (o dejarla en el bucket "sin reseñas" si no aplica).

### `anunciosService.js`
- **Responsabilidad:** simular el servicio de anuncios promocionales, mismo patrón que reseñas pero independiente (para que no fallen/resuelvan en sincronía).
- **Exports:** `obtenerAnuncios(): Promise<Anuncio[]>`.
- **Imports:** ninguno.
- **Parámetros de simulación:** `DELAY_MS = 500`, `PROBABILIDAD_FALLO = 0.3`, independiente de `resenasService.js`.
- **Fallo forzado:** `?forzarFallo=anuncios` o `?forzarFallo=todos`.
- **Mock:** 2 anuncios (`titulo`, `texto`).

---

## `js/orquestador/orquestarServicios.js`

- **Responsabilidad:** disparar los tres servicios en paralelo con `Promise.allSettled` y devolver un resultado consolidado.
- **Exports:** `orquestarServicios(): Promise<{ peliculas: Pelicula[], resenas: Resena[] | null, anuncios: Anuncio[] | null }>`.
- **Imports:** `obtenerCatalogo` (`../services/catalogoService.js`), `obtenerResenas` (`../services/resenasService.js`), `obtenerAnuncios` (`../services/anunciosService.js`).
- **Lógica:**
  - Si `catalogo` rechaza → propaga el error (fatal; lo atrapa el `catch` de `iniciar()` en `main.js`).
  - Si `resenas`/`anuncios` rechazan → se devuelven como `null` (con `console.warn` del motivo), sin romper el resto del flujo.

---

## `js/cache/filtroCache.js`

- **Responsabilidad:** filtrar películas por género con un caché privado por closure, para no repetir la simulación de latencia en géneros ya consultados.
- **Exports:** `crearFiltroPeliculas(peliculas): { filtrarPorGenero(genero): Promise<Pelicula[]> }`.
- **Imports:** ninguno (autocontenido).
- **Parámetros de simulación:** `DELAY_MS = 500`.
- **Detalles clave del diseño:**
  - El caché se indexa por la **categoría canónica en español** (`pelicula.categoria`), no por el texto que muestra el `<select>` — así no se invalida al cambiar de idioma ("Acción" en ES y "Action" en EN resuelven a la misma clave, vía un mapa `categoria`/`categoriaEn` → clave canónica construido una sola vez, de forma sincrónica, al crear la instancia).
  - `"todas"` devuelve el array completo sin tocar el caché.
  - La promesa se guarda en el caché **antes** de esperarla, así dos llamadas simultáneas al mismo género comparten la misma promesa en vez de disparar dos simulaciones.
  - Los objetos que cachea son siempre los **originales sin traducir** (nunca copias de `traducirPelicula`), para que `render.js` los traduzca correctamente sin importar en qué idioma se cacheó el resultado.

---

## `js/main.js`

- **Responsabilidad:** único punto de entrada; orquesta `orquestarServicios()`, crea el filtro de género, conecta todos los eventos delegados y arma el panel de reseñas del modal.
- **No exporta nada** (se autoejecuta con `iniciar()` al final del archivo).
- **Imports:** todos los `core/*` necesarios (incluye `calcularRetrasoEntrada` de `animaciones.js`, reutilizado para el delay escalonado de las reseñas), `orquestarServicios` (`./orquestador/orquestarServicios.js`), `crearFiltroPeliculas` (`./cache/filtroCache.js`).
- **Flujo relevante:**
  - `iniciar()`: llama a `orquestarServicios()`, guarda `peliculas` y `resenas` (esta última puede quedar en `null` si el servicio falló), crea `filtroPeliculas = crearFiltroPeliculas(peliculas)`, renderiza catálogo + banner de anuncios (solo si `anuncios` no es `null`).
  - `aplicarFiltros()` (async): deshabilita `#filtro-categoria`, resuelve el género vía `filtroPeliculas.filtrarPorGenero(...)`, aplica `filtrarPeliculas(resultado, texto, "todas")`, renderiza, y rehabilita el select en un `finally` (evita condiciones de carrera si el usuario cambia de género rápido).
  - `manejarClickEnContenedor()`: al hacer click en una card (fuera del botón de favorito), llama a `abrirModal(tarjeta.dataset)` y, a continuación, a `renderizarResenasModal(Number(tarjeta.dataset.id))`.
  - `renderizarResenasModal(peliculaId)`: siempre arranca ocultando y vaciando `#modal-resenas`; si `resenas` es `null` (el servicio falló) o no hay ninguna reseña con ese `peliculaId`, no hace nada más — `#modal-resenas` queda con `display: none` (no ocupa espacio) y el modal se centra solo, como siempre. Si hay reseñas para esa película, las pinta dentro de `#modal-resenas` (una `animation-delay` por índice vía `calcularRetrasoEntrada`) y le saca la clase `oculto`. Como `#modal-resenas` es hijo del mismo `#modal-overlay` que `.modal`, se abre y cierra junto con el modal sin necesidad de tocar `core/modal.js`.
- **Estilo visual (`styles.css`):** `#modal-resenas` es transparente (sin fondo/borde/sombra propios); el efecto "flotante" está en cada `.modal-resenas__item`: sombra individual, rotación alterna por `nth-child` (impar/par) que se endereza al hover, y `@keyframes resena-flota` (entrada deslizando desde la derecha) combinada con el `animation-delay` que pone `main.js`. El scrollbar de `#modal-resenas` está reestilado a mano (`scrollbar-color`/`scrollbar-width` para Firefox, `::-webkit-scrollbar*` para Chrome/Edge/Safari) con pista transparente y "thumb" en `--color-primario`, en vez del scrollbar gris por defecto del navegador.
- **Bug corregido — `.oculto` necesita `!important` (`styles.css`):** `.modal-resenas` y `.anuncios` declaran su propio `display: flex`. Como `.oculto { display: none; }` estaba definida antes que esas reglas en el archivo y todas tienen la misma especificidad (una sola clase), `.modal-resenas`/`.anuncios` le ganaban a `.oculto` por orden de aparición — el panel de reseñas vacío seguía ocupando 260px en el `flex` de `#modal-overlay` y corría el modal hacia la izquierda en vez de centrarlo solo. Fix: `.oculto { display: none !important; }`. Cualquier elemento nuevo que se oculte con esta clase y también declare `display` queda cubierto sin tocar nada más.
