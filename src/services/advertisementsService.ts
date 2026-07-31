import { mapAnunciosDtoToEntities } from "../mappers/advertisementMapper.js";
import type { Anuncio } from "../entities/Advertisement.js";
import type { AnuncioDTO } from "../dtos/Advertisement.DTO.js";

const PROBABILIDAD_FALLO = 0;
const DELAY_MS = 500;

const ANUNCIOS_MOCK: AnuncioDTO[] = [
  {
    titulo: "Semana del Cine Clásico",
    texto: "20% de descuento en funciones seleccionadas de nuestros clásicos favoritos.",
    imagenFondo: "banners/SemanaCineClasico.webp",
    textoCta: "Ver Cartelera",
  },
  {
    titulo: "Estrenos de Ciencia Ficción",
    texto: "Anotate para la preventa de la próxima saga antes que se agote.",
    imagenFondo: "banners/EstrenosCienciaFiccion.webp",
    textoCta: "Reservar Preventa",
  },
  {
    titulo: "Maratón de Terror",
    texto: "Funciones a mitad de precio todas las noches de la semana.",
    imagenFondo: "banners/MaratonDeTerror.webp",
    textoCta: "Comprar Entradas",
  },
];

const parametros = new URLSearchParams(window.location.search);

function debeFallarForzado(): boolean {
  const valor = parametros.get("forzarFallo");
  return valor === "anuncios" || valor === "todos";
}

export function obtenerAnuncios(): Promise<Anuncio[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (debeFallarForzado() || Math.random() < PROBABILIDAD_FALLO) {
        reject(new Error("Servicio de anuncios no disponible"));
        return;
      }
      resolve(mapAnunciosDtoToEntities(ANUNCIOS_MOCK));
    }, DELAY_MS);
  });
}
