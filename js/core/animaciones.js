const RETRASO_POR_TARJETA_MS = 40;
const TOPE_TARJETAS_ESCALONADAS = 15;

export function calcularRetrasoEntrada(indice) {
  return `${Math.min(indice, TOPE_TARJETAS_ESCALONADAS) * RETRASO_POR_TARJETA_MS}ms`;
}

export function animarFavorito(boton) {
  boton.classList.remove("animar");
  void boton.offsetWidth;
  boton.classList.add("animar");
  boton.addEventListener("animationend", () => boton.classList.remove("animar"), { once: true });
}
