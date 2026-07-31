/**
 * Helper mínimo para tipar getElementById sin repetir aserciones non-null:
 * los ids que usa el proyecto están garantizados por index.html.
 */
export function obtenerElemento<T extends HTMLElement = HTMLElement>(id: string): T {
  const elemento = document.getElementById(id);
  if (!elemento) {
    throw new Error(`No se encontró el elemento #${id}`);
  }
  return elemento as T;
}
