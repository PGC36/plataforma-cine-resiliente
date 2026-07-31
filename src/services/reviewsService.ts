import { mapResenasDtoToEntities } from "../mappers/reviewMapper.js";
import type { Resena } from "../entities/Review.js";
import type { ResenaDTO } from "../dtos/Review.DTO.js";
import type { ResenasResponseDTO } from "../dtos/ReviewsResponse.DTO.js";

const PROBABILIDAD_FALLO = 0;
const DELAY_MS = 700;

const parametros = new URLSearchParams(window.location.search);

function debeFallarForzado(): boolean {
  const valor = parametros.get("forzarFallo");
  return valor === "resenas" || valor === "todos";
}

async function cargarResenasDesdeJSON(): Promise<ResenaDTO[]> {
  const respuesta = await fetch("resenas.json");

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar el archivo de reseñas");
  }

  const datos: ResenasResponseDTO = await respuesta.json();
  return datos.resenas;
}

export function obtenerResenas(): Promise<Resena[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (debeFallarForzado() || Math.random() < PROBABILIDAD_FALLO) {
        reject(new Error("Servicio de reseñas no disponible"));
        return;
      }
      cargarResenasDesdeJSON().then((dtos) => resolve(mapResenasDtoToEntities(dtos)), reject);
    }, DELAY_MS);
  });
}
