import { renderizarPeliculas } from "./core/render.js";
import { abrirModal, inicializarModal } from "./core/modal.js";
import { alternarFavorito, actualizarContadorFavoritos } from "./core/favoritos.js";
import { poblarCategorias, filtrarPeliculas } from "./core/filtros.js";
import { obtenerIdioma, establecerIdioma, aplicarIdioma, obtenerTraduccion } from "./core/idioma.js";
import { animarFavorito, calcularRetrasoEntrada } from "./core/animaciones.js";
import { orquestarServicios } from "./orquestador/orquestarServicios.js";
import { crearFiltroPeliculas } from "./cache/filtroCache.js";

const contenedor = document.getElementById("contenedor-peliculas");
const buscador = document.getElementById("buscador");
const filtroCategoria = document.getElementById("filtro-categoria");
const botonIdioma = document.getElementById("boton-idioma");
const seccionAnuncios = document.getElementById("seccion-anuncios");
const modalResenas = document.getElementById("modal-resenas");

let peliculas = [];
let filtroPeliculas = null;
let resenas = null;
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
  renderizarResenasModal(Number(tarjeta.dataset.id));
}

async function aplicarFiltros() {
  filtroCategoria.disabled = true;
  try {
    const peliculasDelGenero = await filtroPeliculas.filtrarPorGenero(filtroCategoria.value);
    const peliculasFiltradas = filtrarPeliculas(peliculasDelGenero, buscador.value, "todas");
    renderizarPeliculas(peliculasFiltradas, contenedor);
  } finally {
    filtroCategoria.disabled = false;
  }
}

function manejarCambioIdioma() {
  const nuevoIdioma = obtenerIdioma() === "es" ? "en" : "es";
  establecerIdioma(nuevoIdioma);
  aplicarIdioma();
  filtroCategoria.value = "todas";
  poblarCategorias(peliculas, filtroCategoria);
  aplicarFiltros();
}

function renderizarAnuncios(anuncios) {
  if (!anuncios) return;

  seccionAnuncios.innerHTML = anuncios
    .map(
      (anuncio) => `
        <article class="anuncios__item">
          <h3 class="anuncios__titulo">${anuncio.titulo}</h3>
          <p class="anuncios__texto">${anuncio.texto}</p>
        </article>
      `
    )
    .join("");
  seccionAnuncios.classList.remove("oculto");
}

function renderizarResenasModal(peliculaId) {
  modalResenas.classList.add("oculto");
  modalResenas.innerHTML = "";

  if (!resenas) return;

  const resenasDeLaPelicula = resenas.filter((resena) => resena.peliculaId === peliculaId);
  if (resenasDeLaPelicula.length === 0) return;

  modalResenas.innerHTML = resenasDeLaPelicula
    .map(
      (resena, indice) => `
        <article class="modal-resenas__item" style="animation-delay: ${calcularRetrasoEntrada(indice)}">
          <p class="modal-resenas__comentario">"${resena.comentario}"</p>
          <p class="modal-resenas__autor">— ${resena.autor} · ⭐ ${resena.puntuacion}</p>
        </article>
      `
    )
    .join("");
  modalResenas.classList.remove("oculto");
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
    const resultado = await orquestarServicios();
    peliculas = resultado.peliculas;
    resenas = resultado.resenas;
    filtroPeliculas = crearFiltroPeliculas(peliculas);

    poblarCategorias(peliculas, filtroCategoria);
    renderizarPeliculas(peliculas, contenedor);

    renderizarAnuncios(resultado.anuncios);
  } catch (error) {
    contenedor.innerHTML = `<p>${obtenerTraduccion("error")}</p>`;
    console.error(error);
  }
}

iniciar();
