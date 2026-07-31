import { renderizarPeliculas } from "./core/render.js";
import { abrirModal, inicializarModal } from "./core/modal.js";
import { alternarFavorito, actualizarContadorFavoritos } from "./core/favorites.js";
import { poblarCategorias, filtrarPeliculas } from "./core/filters.js";
import { obtenerIdioma, establecerIdioma, aplicarIdioma, obtenerTraduccion } from "./core/language.js";
import { animarFavorito, calcularRetrasoEntrada } from "./core/animations.js";
import { obtenerElemento } from "./core/dom.js";
import { orquestarServicios } from "./orquestador/orchestrateServices.js";
import { crearFiltroPeliculas } from "./cache/filterCache.js";
import type { FiltroPeliculas } from "./cache/filterCache.js";
import type { Pelicula } from "./entities/Movie.js";
import type { Resena } from "./entities/Review.js";
import type { Anuncio } from "./entities/Advertisement.js";

const contenedor = obtenerElemento("contenedor-peliculas");
const buscador = obtenerElemento<HTMLInputElement>("buscador");
const filtroCategoria = obtenerElemento<HTMLSelectElement>("filtro-categoria");
const botonIdioma = obtenerElemento("boton-idioma");
const seccionAnuncios = obtenerElemento("seccion-anuncios");
const anunciosSlide = obtenerElemento("anuncios-slide");
const anunciosAnterior = obtenerElemento("anuncios-anterior");
const anunciosSiguiente = obtenerElemento("anuncios-siguiente");
const anunciosIndicadores = obtenerElemento("anuncios-indicadores");
const modalResenas = obtenerElemento("modal-resenas");

const INTERVALO_AUTOPLAY_MS = 6000;

let peliculas: Pelicula[] = [];
let filtroPeliculas: FiltroPeliculas | null = null;
let resenas: Resena[] | null = null;
let anuncios: Anuncio[] = [];
let indiceAnuncioActual = 0;
let temporizadorAutoplayAnuncios: number | undefined;
let temporizadorBusqueda: number | undefined;

function aplicarFiltrosConDelay(): void {
  clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = setTimeout(aplicarFiltros, 300);
}

function manejarClickEnContenedor(evento: MouseEvent): void {
  const objetivo = evento.target as HTMLElement;
  const tarjeta = objetivo.closest<HTMLElement>(".tarjeta");
  if (!tarjeta) return;

  const botonFavorito = objetivo.closest<HTMLElement>(".tarjeta__favorito");

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

async function aplicarFiltros(): Promise<void> {
  if (!filtroPeliculas) return;

  filtroCategoria.disabled = true;
  try {
    const peliculasDelGenero = await filtroPeliculas.filtrarPorGenero(filtroCategoria.value);
    const peliculasFiltradas = filtrarPeliculas(peliculasDelGenero, buscador.value, "todas");
    renderizarPeliculas(peliculasFiltradas, contenedor);
  } finally {
    filtroCategoria.disabled = false;
  }
}

function manejarCambioIdioma(): void {
  const nuevoIdioma = obtenerIdioma() === "es" ? "en" : "es";
  establecerIdioma(nuevoIdioma);
  aplicarIdioma();
  filtroCategoria.value = "todas";
  poblarCategorias(peliculas, filtroCategoria);
  aplicarFiltros();
}

function pintarSlideAnuncioActual(): void {
  const anuncio = anuncios[indiceAnuncioActual];
  if (!anuncio) return;

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

function reiniciarAutoplayAnuncios(): void {
  clearInterval(temporizadorAutoplayAnuncios);
  if (anuncios.length > 1) {
    temporizadorAutoplayAnuncios = setInterval(() => irAAnuncio(indiceAnuncioActual + 1), INTERVALO_AUTOPLAY_MS);
  }
}

function irAAnuncio(indice: number): void {
  indiceAnuncioActual = (indice + anuncios.length) % anuncios.length;
  pintarSlideAnuncioActual();
  reiniciarAutoplayAnuncios();
}

function renderizarAnuncios(datos: Anuncio[] | null): void {
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

function renderizarResenasModal(peliculaId: number): void {
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

async function iniciar(): Promise<void> {
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
    const objetivo = evento.target as HTMLElement;
    const punto = objetivo.closest<HTMLElement>(".anuncios__punto");
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
