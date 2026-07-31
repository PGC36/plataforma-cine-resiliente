import type { ResenaDTO } from "./Review.DTO.js";

/** Envelope crudo del endpoint de reseñas (resenas.json). */
export interface ResenasResponseDTO {
  resenas: ResenaDTO[];
}
