import type { Pelicula } from "../entities/Movie.js";

type Idioma = "es" | "en";

interface Traduccion {
  buscar: string;
  todas: string;
  favorito: string;
  cerrar: string;
  anio: string;
  director: string;
  duracion: string;
  calificacion: string;
  min: string;
  footer: string;
  error: string;
}

type ClaveTraduccion = keyof Traduccion;

const CLAVE_ALMACENAMIENTO = "idioma-preferido";

const traducciones: Record<Idioma, Traduccion> = {
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

export function obtenerIdioma(): Idioma {
  return (localStorage.getItem(CLAVE_ALMACENAMIENTO) as Idioma | null) || "es";
}

export function obtenerTraduccion(clave: ClaveTraduccion): string {
  const idioma = obtenerIdioma();
  return traducciones[idioma][clave];
}

export function establecerIdioma(idioma: Idioma): void {
  localStorage.setItem(CLAVE_ALMACENAMIENTO, idioma);
}

export function traducirPelicula(pelicula: Pelicula): Pelicula {
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

export function aplicarIdioma(): void {
  const idioma = obtenerIdioma();
  const diccionario = traducciones[idioma];

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((elemento) => {
    const clave = elemento.dataset.i18n as ClaveTraduccion;
    elemento.textContent = diccionario[clave];
  });

  document.querySelectorAll<HTMLElement>("[data-i18n-placeholder]").forEach((elemento) => {
    if (elemento instanceof HTMLInputElement) {
      const clave = elemento.dataset.i18nPlaceholder as ClaveTraduccion;
      elemento.placeholder = diccionario[clave];
    }
  });

  document.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach((elemento) => {
    const clave = elemento.dataset.i18nAria as ClaveTraduccion;
    elemento.setAttribute("aria-label", diccionario[clave]);
  });

  document.documentElement.lang = idioma;

  const botonIdioma = document.getElementById("boton-idioma");
  if (botonIdioma) {
    botonIdioma.textContent = idioma === "es" ? "EN" : "ES";
  }
}
