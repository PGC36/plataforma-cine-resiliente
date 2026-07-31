const DELAY_PER_CARD_MS = 40;
const STAGGERED_CARDS_CAP = 15;

export function calculateEntryDelay(index: number): string {
  return `${Math.min(index, STAGGERED_CARDS_CAP) * DELAY_PER_CARD_MS}ms`;
}

export function animateFavorite(button: HTMLElement): void {
  button.classList.remove("animate");
  void button.offsetWidth;
  button.classList.add("animate");
  button.addEventListener("animationend", () => button.classList.remove("animate"), { once: true });
}
