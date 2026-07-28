const CLAVE_ALMACENAMIENTO = "peliculas-favoritas";

function cargarFavoritos() {
  const guardados = localStorage.getItem(CLAVE_ALMACENAMIENTO);
  return new Set(guardados ? JSON.parse(guardados) : []);
}

const favoritos = cargarFavoritos();

function guardarFavoritos() {
  localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify([...favoritos]));
}

export function esFavorito(id) {
  return favoritos.has(id);
}

export function alternarFavorito(id) {
  if (favoritos.has(id)) {
    favoritos.delete(id);
  } else {
    favoritos.add(id);
  }
  guardarFavoritos();
  return favoritos.has(id);
}

export function contarFavoritos() {
  return favoritos.size;
}

export function actualizarContadorFavoritos() {
  const elementoContador = document.getElementById("contador-favoritos-numero");
  if (elementoContador) {
    elementoContador.textContent = contarFavoritos();
  }
}
