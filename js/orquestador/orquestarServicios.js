import { obtenerCatalogo } from "../services/catalogoService.js";
import { obtenerResenas } from "../services/resenasService.js";
import { obtenerAnuncios } from "../services/anunciosService.js";

export async function orquestarServicios() {
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
