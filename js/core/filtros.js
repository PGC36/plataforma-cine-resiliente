import { traducirPelicula } from "./idioma.js";

export function poblarCategorias(peliculas, selectElemento) {
  selectElemento
    .querySelectorAll("option:not([value='todas'])")
    .forEach((opcion) => opcion.remove());

  const categorias = [
    ...new Set(peliculas.map((pelicula) => traducirPelicula(pelicula).categoria)),
  ].sort();

  categorias.forEach((categoria) => {
    const opcion = document.createElement("option");
    opcion.value = categoria;
    opcion.textContent = categoria;
    selectElemento.appendChild(opcion);
  });
}

export function filtrarPeliculas(peliculas, texto, categoria) {
  const textoNormalizado = texto.trim().toLowerCase();

  return peliculas.filter((peliculaOriginal) => {
    const pelicula = traducirPelicula(peliculaOriginal);
    const coincideTexto = pelicula.titulo.toLowerCase().includes(textoNormalizado);
    const coincideCategoria = categoria === "todas" || pelicula.categoria === categoria;
    return coincideTexto && coincideCategoria;
  });
}
