import { obtenerCatalogo } from "../services/catalogService.js";
import { obtenerResenas } from "../services/reviewsService.js";
import { obtenerAnuncios } from "../services/advertisementsService.js";
import type { Pelicula } from "../entities/Movie.js";
import type { Resena } from "../entities/Review.js";
import type { Anuncio } from "../entities/Advertisement.js";

export interface ResultadoOrquestacion {
  peliculas: Pelicula[];
  resenas: Resena[] | null;
  anuncios: Anuncio[] | null;
}

export async function orquestarServicios(): Promise<ResultadoOrquestacion> {
  const [resCatalogo, resResenas, resAnuncios] = await Promise.allSettled([
    obtenerCatalogo(),
    obtenerResenas(),
    obtenerAnuncios(),
  ]);

  if (resCatalogo.status === "rejected") {
    throw resCatalogo.reason;
  }

  if (resResenas.status === "rejected") {
    console.warn("Reseñas no disponibles:", resResenas.reason);
  }

  if (resAnuncios.status === "rejected") {
    console.warn("Anuncios no disponibles:", resAnuncios.reason);
  }

  return {
    peliculas: resCatalogo.value,
    resenas: resResenas.status === "fulfilled" ? resResenas.value : null,
    anuncios: resAnuncios.status === "fulfilled" ? resAnuncios.value : null,
  };
}
