export async function obtenerPeliculas() {
  const respuesta = await fetch("peliculas.json");

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar el archivo de películas");
  }

  const datos = await respuesta.json();
  return datos.peliculas;
}
