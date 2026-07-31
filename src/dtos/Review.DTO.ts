/** Forma cruda de cada reseña tal como llega de resenas.json. */
export interface ResenaDTO {
  peliculaId: number;
  autor: string;
  comentario: string;
  puntuacion: number;
}
