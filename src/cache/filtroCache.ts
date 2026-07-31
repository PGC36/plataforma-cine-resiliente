import type { Pelicula } from "../entities/Pelicula.js";

const DELAY_MS = 500;

export interface FiltroPeliculas {
  filtrarPorGenero(genero: string): Promise<Pelicula[]>;
}

export function crearFiltroPeliculas(peliculas: Pelicula[]): FiltroPeliculas {
  const cache: Record<string, Promise<Pelicula[]> | Pelicula[]> = {};
  const mapaCategoriaACanonica: Record<string, string> = {};

  peliculas.forEach((pelicula) => {
    mapaCategoriaACanonica[pelicula.categoria] = pelicula.categoria;
    mapaCategoriaACanonica[pelicula.categoriaEn] = pelicula.categoria;
  });

  function simularConsultaDeGenero(categoriaCanonica: string): Promise<Pelicula[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(peliculas.filter((pelicula) => pelicula.categoria === categoriaCanonica));
      }, DELAY_MS);
    });
  }

  async function filtrarPorGenero(generoMostrado: string): Promise<Pelicula[]> {
    if (generoMostrado === "todas") {
      return peliculas;
    }

    const categoriaCanonica = mapaCategoriaACanonica[generoMostrado] ?? generoMostrado;

    const cacheado = cache[categoriaCanonica];
    if (cacheado) {
      return cacheado;
    }

    const promesa = simularConsultaDeGenero(categoriaCanonica);
    cache[categoriaCanonica] = promesa;
    const resultado = await promesa;
    cache[categoriaCanonica] = resultado;
    return resultado;
  }

  return { filtrarPorGenero };
}
