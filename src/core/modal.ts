import { obtenerElemento } from "./dom.js";

const modalOverlay = obtenerElemento("modal-overlay");
const modalCerrar = obtenerElemento("modal-cerrar");
const modalImagen = obtenerElemento<HTMLImageElement>("modal-imagen");
const modalCategoria = obtenerElemento("modal-categoria");
const modalTitulo = obtenerElemento("modal-titulo");
const modalDescripcion = obtenerElemento("modal-descripcion");
const modalAnio = obtenerElemento("modal-anio");
const modalDirector = obtenerElemento("modal-director");
const modalDuracion = obtenerElemento("modal-duracion");
const modalCalificacion = obtenerElemento("modal-calificacion");

export function abrirModal(datos: DOMStringMap): void {
  const { titulo, anio, director, categoria, duracion, calificacion, descripcion, imagen } = datos;

  modalImagen.src = imagen ?? "";
  modalImagen.alt = `Póster de ${titulo ?? ""}`;
  modalCategoria.textContent = categoria ?? "";
  modalTitulo.textContent = titulo ?? "";
  modalDescripcion.textContent = descripcion ?? "";
  modalAnio.textContent = anio ?? "";
  modalDirector.textContent = director ?? "";
  modalDuracion.textContent = duracion ?? "";
  modalCalificacion.textContent = calificacion ?? "";

  modalOverlay.classList.add("activo");
  document.body.classList.add("sin-scroll");
}

export function cerrarModal(): void {
  modalOverlay.classList.remove("activo");
  document.body.classList.remove("sin-scroll");
}

export function inicializarModal(): void {
  modalCerrar.addEventListener("click", cerrarModal);

  modalOverlay.addEventListener("click", (evento) => {
    if (evento.target === modalOverlay) cerrarModal();
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") cerrarModal();
  });
}
