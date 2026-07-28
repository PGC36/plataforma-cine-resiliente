import { esFavorito } from "./favoritos.js";
import { obtenerTraduccion, traducirPelicula } from "./idioma.js";
import { calcularRetrasoEntrada } from "./animaciones.js";

function crearTarjeta(peliculaOriginal, indice) {
  const pelicula = traducirPelicula(peliculaOriginal);
  const articulo = document.createElement("article");
  articulo.className = "tarjeta";
  articulo.style.animationDelay = calcularRetrasoEntrada(indice);
  articulo.dataset.id = pelicula.id;
  articulo.dataset.titulo = pelicula.titulo;
  articulo.dataset.anio = pelicula.anio;
  articulo.dataset.director = pelicula.director;
  articulo.dataset.categoria = pelicula.categoria;
  articulo.dataset.duracion = pelicula.duracion;
  articulo.dataset.calificacion = pelicula.calificacion;
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

export function renderizarPeliculas(peliculas, contenedor) {
  contenedor.innerHTML = "";
  const fragmento = document.createDocumentFragment();
  peliculas.forEach((pelicula, indice) => fragmento.appendChild(crearTarjeta(pelicula, indice)));
  contenedor.appendChild(fragmento);
}
