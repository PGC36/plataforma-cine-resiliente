import { mapAdvertisementsDtoToEntities } from "../mappers/Advertisement.Mapper";
import type { Advertisement } from "../entities/Advertisement";
import type { AdvertisementDTO } from "../dtos/Advertisement.DTO";

const PROBABILITY_OF_FAILURE = 0;
const DELAY_MS = 500;

const ADVERTISEMENTS_MOCK: AdvertisementDTO[] = [
  {
    title: "Semana del Cine Clásico",
    text: "20% de descuento en funciones seleccionadas de nuestros clásicos favoritos.",
    backgroundImage: "/banners/SemanaCineClasico.webp",
    ctaText: "Ver Cartelera",
  },
  {
    title: "Estrenos de Ciencia Ficción",
    text: "Anotate para la preventa de la próxima saga antes que se agote.",
    backgroundImage: "/banners/EstrenosCienciaFiccion.webp",
    ctaText: "Reservar Preventa",
  },
  {
    title: "Maratón de Terror",
    text: "Funciones a mitad de precio todas las noches de la semana.",
    backgroundImage: "/banners/MaratonDeTerror.webp",
    ctaText: "Comprar Entradas",
  },
];

function shouldForceFail(): boolean {
  const params = new URLSearchParams(window.location.search);
  const value = params.get("forceFail");
  return value === "advertisements" || value === "all";
}

export function getAdvertisements(): Promise<Advertisement[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldForceFail() || Math.random() < PROBABILITY_OF_FAILURE) {
        reject(new Error("Advertisements service unavailable"));
        return;
      }
      resolve(mapAdvertisementsDtoToEntities(ADVERTISEMENTS_MOCK));
    }, DELAY_MS);
  });
}
