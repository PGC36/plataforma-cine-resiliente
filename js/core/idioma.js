const CLAVE_ALMACENAMIENTO = "idioma-preferido";

const traducciones = {
  es: {
    buscar: "Buscar película...",
    todas: "Todas las categorías",
    favorito: "Agregar a favoritos",
    cerrar: "Cerrar",
    anio: "Año:",
    director: "Director:",
    duracion: "Duración:",
    calificacion: "Calificación:",
    min: "min",
    footer: "Catálogo de películas — CapyFilms",
    error: "No se pudieron cargar las películas.",
  },
  en: {
    buscar: "Search movie...",
    todas: "All categories",
    favorito: "Add to favorites",
    cerrar: "Close",
    anio: "Year:",
    director: "Director:",
    duracion: "Duration:",
    calificacion: "Rating:",
    min: "min",
    footer: "Movie catalog — CapyFilms",
    error: "Movies could not be loaded.",
  },
};

export function obtenerIdioma() {
  return localStorage.getItem(CLAVE_ALMACENAMIENTO) || "es";
}

export function obtenerTraduccion(clave) {
  const idioma = obtenerIdioma();
  return traducciones[idioma][clave];
}

export function establecerIdioma(idioma) {
  localStorage.setItem(CLAVE_ALMACENAMIENTO, idioma);
}

export function traducirPelicula(pelicula) {
  if (obtenerIdioma() === "en") {
    return {
      ...pelicula,
      titulo: pelicula.tituloEn,
      categoria: pelicula.categoriaEn,
      descripcion: pelicula.descripcionEn,
    };
  }
  return pelicula;
}

export function aplicarIdioma() {
  const idioma = obtenerIdioma();
  const diccionario = traducciones[idioma];

  document.querySelectorAll("[data-i18n]").forEach((elemento) => {
    elemento.textContent = diccionario[elemento.dataset.i18n];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((elemento) => {
    elemento.placeholder = diccionario[elemento.dataset.i18nPlaceholder];
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((elemento) => {
    elemento.setAttribute("aria-label", diccionario[elemento.dataset.i18nAria]);
  });

  document.documentElement.lang = idioma;

  const botonIdioma = document.getElementById("boton-idioma");
  if (botonIdioma) {
    botonIdioma.textContent = idioma === "es" ? "EN" : "ES";
  }
}
