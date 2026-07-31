const CLAVE_ALMACENAMIENTO = "peliculas-favoritas";

function cargarFavoritos(): Set<number> {
  const guardados = localStorage.getItem(CLAVE_ALMACENAMIENTO);
  return new Set(guardados ? (JSON.parse(guardados) as number[]) : []);
}

const favoritos = cargarFavoritos();

function guardarFavoritos(): void {
  localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify([...favoritos]));
}

export function esFavorito(id: number): boolean {
  return favoritos.has(id);
}

export function alternarFavorito(id: number): boolean {
  if (favoritos.has(id)) {
    favoritos.delete(id);
  } else {
    favoritos.add(id);
  }
  guardarFavoritos();
  return favoritos.has(id);
}

export function contarFavoritos(): number {
  return favoritos.size;
}

export function actualizarContadorFavoritos(): void {
  const elementoContador = document.getElementById("contador-favoritos-numero");
  if (elementoContador) {
    elementoContador.textContent = String(contarFavoritos());
  }
}
