import { esFavorito } from "./favorites.js";
import { obtenerTraduccion, traducirPelicula } from "./language.js";
import { calcularRetrasoEntrada } from "./animations.js";
import type { Pelicula } from "../entities/Movie.js";

function crearTarjeta(peliculaOriginal: Pelicula, indice: number): HTMLElement {
  const pelicula = traducirPelicula(peliculaOriginal);
  const articulo = document.createElement("article");
  articulo.className = "tarjeta";
  articulo.style.animationDelay = calcularRetrasoEntrada(indice);
  articulo.dataset.id = String(pelicula.id);
  articulo.dataset.titulo = pelicula.titulo;
  articulo.dataset.anio = String(pelicula.anio);
  articulo.dataset.director = pelicula.director;
  articulo.dataset.categoria = pelicula.categoria;
  articulo.dataset.duracion = String(pelicula.duracion);
  articulo.dataset.calificacion = String(pelicula.calificacion);
  articulo.dataset.descripcion = pelicula.descripcion;
  articulo.dataset.imagen = pelicula.imagen;

  const claseActiva = esFavorito(pelicula.id) ? "activo" : "";

  articulo.innerHTML = `
    <button class="tarjeta__favorito ${claseActiva}" aria-label="${obtenerTraduccion("favorito")}">♥</button>
    <img class="tarjeta__imagen" src="${pelicula.imagen}" alt="Póster de ${pelicula.titulo}" loading="lazy" />
    <div class="tarjeta__categoria">${pelicula.categoria}</div>
    <h2 class="tarjeta__titulo">${pelicula.titulo}</h2>
    <p class="tarjeta__info"><span>${pelicula.anio}</span> · <span>${pelicula.director}</span></p>
    <p class="tarjeta__info">${pelicula.duracion} ${obtenerTraduccion("min")} · ⭐ ${pelicula.calificacion}</p>
  `;

  return articulo;
}

export function renderizarPeliculas(peliculas: Pelicula[], contenedor: HTMLElement): void {
  contenedor.innerHTML = "";
  const fragmento = document.createDocumentFragment();
  peliculas.forEach((pelicula, indice) => fragmento.appendChild(crearTarjeta(pelicula, indice)));
  contenedor.appendChild(fragmento);
}
