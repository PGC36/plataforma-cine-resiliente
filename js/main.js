import { obtenerPeliculas } from "./core/data.js";
import { renderizarPeliculas } from "./core/render.js";
import { abrirModal, inicializarModal } from "./core/modal.js";
import { alternarFavorito, actualizarContadorFavoritos } from "./core/favoritos.js";
import { poblarCategorias, filtrarPeliculas } from "./core/filtros.js";
import { obtenerIdioma, establecerIdioma, aplicarIdioma, obtenerTraduccion } from "./core/idioma.js";
import { animarFavorito } from "./core/animaciones.js";

const contenedor = document.getElementById("contenedor-peliculas");
const buscador = document.getElementById("buscador");
const filtroCategoria = document.getElementById("filtro-categoria");
const botonIdioma = document.getElementById("boton-idioma");

let peliculas = [];
let temporizadorBusqueda = null;

function aplicarFiltrosConDelay() {
  clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = setTimeout(aplicarFiltros, 300);
}

function manejarClickEnContenedor(evento) {
  const tarjeta = evento.target.closest(".tarjeta");
  if (!tarjeta) return;

  const botonFavorito = evento.target.closest(".tarjeta__favorito");

  if (botonFavorito) {
    const esFavoritoAhora = alternarFavorito(Number(tarjeta.dataset.id));
    botonFavorito.classList.toggle("activo", esFavoritoAhora);
    actualizarContadorFavoritos();
    animarFavorito(botonFavorito);
    return;
  }

  abrirModal(tarjeta.dataset);
}

function aplicarFiltros() {
  const peliculasFiltradas = filtrarPeliculas(
    peliculas,
    buscador.value,
    filtroCategoria.value
  );
  renderizarPeliculas(peliculasFiltradas, contenedor);
}

function manejarCambioIdioma() {
  const nuevoIdioma = obtenerIdioma() === "es" ? "en" : "es";
  establecerIdioma(nuevoIdioma);
  aplicarIdioma();
  filtroCategoria.value = "todas";
  poblarCategorias(peliculas, filtroCategoria);
  aplicarFiltros();
}

async function iniciar() {
  aplicarIdioma();
  inicializarModal();
  actualizarContadorFavoritos();
  contenedor.addEventListener("click", manejarClickEnContenedor);
  buscador.addEventListener("input", aplicarFiltrosConDelay);
  filtroCategoria.addEventListener("change", aplicarFiltros);
  botonIdioma.addEventListener("click", manejarCambioIdioma);

  try {
    peliculas = await obtenerPeliculas();
    poblarCategorias(peliculas, filtroCategoria);
    renderizarPeliculas(peliculas, contenedor);
  } catch (error) {
    contenedor.innerHTML = `<p>${obtenerTraduccion("error")}</p>`;
    console.error(error);
  }
}

iniciar();
