const DELAY_MS = 500;

export function crearFiltroPeliculas(peliculas) {
  const cache = {};
  const mapaCategoriaACanonica = {};

  peliculas.forEach((pelicula) => {
    mapaCategoriaACanonica[pelicula.categoria] = pelicula.categoria;
    mapaCategoriaACanonica[pelicula.categoriaEn] = pelicula.categoria;
  });

  function simularConsultaDeGenero(categoriaCanonica) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(peliculas.filter((pelicula) => pelicula.categoria === categoriaCanonica));
      }, DELAY_MS);
    });
  }

  async function filtrarPorGenero(generoMostrado) {
    if (generoMostrado === "todas") {
      return peliculas;
    }

    const categoriaCanonica = mapaCategoriaACanonica[generoMostrado] ?? generoMostrado;

    if (cache[categoriaCanonica]) {
      return cache[categoriaCanonica];
    }

    cache[categoriaCanonica] = simularConsultaDeGenero(categoriaCanonica);
    const resultado = await cache[categoriaCanonica];
    cache[categoriaCanonica] = resultado;
    return resultado;
  }

  return { filtrarPorGenero };
}
