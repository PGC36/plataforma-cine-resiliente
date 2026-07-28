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
const anunciosSlide = document.getElementById("anuncios-slide");
const anunciosAnterior = document.getElementById("anuncios-anterior");
const anunciosSiguiente = document.getElementById("anuncios-siguiente");
const anunciosIndicadores = document.getElementById("anuncios-indicadores");
const modalResenas = document.getElementById("modal-resenas");

const INTERVALO_AUTOPLAY_MS = 6000;

let peliculas = [];
let filtroPeliculas = null;
let resenas = null;
let anuncios = [];
let indiceAnuncioActual = 0;
let temporizadorAutoplayAnuncios = null;
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

function pintarSlideAnuncioActual() {
  const anuncio = anuncios[indiceAnuncioActual];

  anunciosSlide.style.backgroundImage = `linear-gradient(90deg, rgba(20,20,28,0.92), rgba(20,20,28,0.35)), url("${anuncio.imagenFondo}")`;
  anunciosSlide.innerHTML = `
    <div class="anuncios__contenido">
      <h3 class="anuncios__titulo">${anuncio.titulo}</h3>
      <p class="anuncios__texto">${anuncio.texto}</p>
      <button type="button" class="anuncios__cta">${anuncio.textoCta}</button>
    </div>
  `;

  anunciosIndicadores.querySelectorAll(".anuncios__punto").forEach((punto, indice) => {
    punto.classList.toggle("activo", indice === indiceAnuncioActual);
  });
}

function reiniciarAutoplayAnuncios() {
  clearInterval(temporizadorAutoplayAnuncios);
  if (anuncios.length > 1) {
    temporizadorAutoplayAnuncios = setInterval(() => irAAnuncio(indiceAnuncioActual + 1), INTERVALO_AUTOPLAY_MS);
  }
}

function irAAnuncio(indice) {
  indiceAnuncioActual = (indice + anuncios.length) % anuncios.length;
  pintarSlideAnuncioActual();
  reiniciarAutoplayAnuncios();
}

function renderizarAnuncios(datos) {
  if (!datos || datos.length === 0) return;

  anuncios = datos;
  indiceAnuncioActual = 0;

  anunciosIndicadores.innerHTML = anuncios
    .map((_, indice) => `<button type="button" class="anuncios__punto" data-indice="${indice}" aria-label="Ir al anuncio ${indice + 1}"></button>`)
    .join("");

  seccionAnuncios.classList.toggle("anuncios--unico", anuncios.length <= 1);
  pintarSlideAnuncioActual();
  reiniciarAutoplayAnuncios();
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
  anunciosAnterior.addEventListener("click", () => irAAnuncio(indiceAnuncioActual - 1));
  anunciosSiguiente.addEventListener("click", () => irAAnuncio(indiceAnuncioActual + 1));
  anunciosIndicadores.addEventListener("click", (evento) => {
    const punto = evento.target.closest(".anuncios__punto");
    if (punto) irAAnuncio(Number(punto.dataset.indice));
  });

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
