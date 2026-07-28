import { obtenerPeliculas } from "../core/data.js";

export async function obtenerCatalogo() {
  return obtenerPeliculas();
}
