/**
 * Forma cruda de cada película tal como llega de peliculas.json,
 * antes de pasar por mappers/peliculaMapper.ts.
 */
export interface PeliculaDTO {
  id: number;
  titulo: string;
  tituloEn?: string;
  anio: number;
  director: string;
  categoria: string;
  categoriaEn?: string;
  duracion: number;
  calificacion: number;
  descripcion: string;
  descripcionEn?: string;
  imagen: string;
}
