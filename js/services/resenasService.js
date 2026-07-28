const PROBABILIDAD_FALLO = 0.3;
const DELAY_MS = 700;

const parametros = new URLSearchParams(window.location.search);

function debeFallarForzado() {
  const valor = parametros.get("forzarFallo");
  return valor === "resenas" || valor === "todos";
}

async function cargarResenasDesdeJSON() {
  const respuesta = await fetch("resenas.json");

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar el archivo de reseñas");
  }

  const datos = await respuesta.json();
  return datos.resenas;
}

export function obtenerResenas() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (debeFallarForzado() || Math.random() < PROBABILIDAD_FALLO) {
        reject(new Error("Servicio de reseñas no disponible"));
        return;
      }
      cargarResenasDesdeJSON().then(resolve, reject);
    }, DELAY_MS);
  });
}
