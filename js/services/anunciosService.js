const PROBABILIDAD_FALLO = 0.3;
const DELAY_MS = 500;

const ANUNCIOS_MOCK = [
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

function debeFallarForzado() {
  const valor = parametros.get("forzarFallo");
  return valor === "anuncios" || valor === "todos";
}

export function obtenerAnuncios() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (debeFallarForzado() || Math.random() < PROBABILIDAD_FALLO) {
        reject(new Error("Servicio de anuncios no disponible"));
        return;
      }
      resolve(ANUNCIOS_MOCK);
    }, DELAY_MS);
  });
}
