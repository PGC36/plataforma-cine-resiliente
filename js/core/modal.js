const modalOverlay = document.getElementById("modal-overlay");
const modalCerrar = document.getElementById("modal-cerrar");
const modalImagen = document.getElementById("modal-imagen");
const modalCategoria = document.getElementById("modal-categoria");
const modalTitulo = document.getElementById("modal-titulo");
const modalDescripcion = document.getElementById("modal-descripcion");
const modalAnio = document.getElementById("modal-anio");
const modalDirector = document.getElementById("modal-director");
const modalDuracion = document.getElementById("modal-duracion");
const modalCalificacion = document.getElementById("modal-calificacion");

export function abrirModal(datos) {
  const { titulo, anio, director, categoria, duracion, calificacion, descripcion, imagen } = datos;

  modalImagen.src = imagen;
  modalImagen.alt = `Póster de ${titulo}`;
  modalCategoria.textContent = categoria;
  modalTitulo.textContent = titulo;
  modalDescripcion.textContent = descripcion;
  modalAnio.textContent = anio;
  modalDirector.textContent = director;
  modalDuracion.textContent = duracion;
  modalCalificacion.textContent = calificacion;

  modalOverlay.classList.add("activo");
  document.body.classList.add("sin-scroll");
}

export function cerrarModal() {
  modalOverlay.classList.remove("activo");
  document.body.classList.remove("sin-scroll");
}

export function inicializarModal() {
  modalCerrar.addEventListener("click", cerrarModal);

  modalOverlay.addEventListener("click", (evento) => {
    if (evento.target === modalOverlay) cerrarModal();
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") cerrarModal();
  });
}
