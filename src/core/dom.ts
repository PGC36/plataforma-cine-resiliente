/**
 * Minimal helper to type getElementById without repeating non-null
 * assertions: the ids used by the project are guaranteed by index.html.
 */
export function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element #${id} was not found`);
  }
  return element as T;
}
