import { getElement } from "./dom.js";

const modalOverlay = getElement("modal-overlay");
const modalClose = getElement("modal-close");
const modalImage = getElement<HTMLImageElement>("modal-image");
const modalCategory = getElement("modal-category");
const modalTitle = getElement("modal-title");
const modalDescription = getElement("modal-description");
const modalYear = getElement("modal-year");
const modalDirector = getElement("modal-director");
const modalDuration = getElement("modal-duration");
const modalRating = getElement("modal-rating");

export function openModal(data: DOMStringMap): void {
  const { title, year, director, category, duration, rating, description, image } = data;

  modalImage.src = image ?? "";
  modalImage.alt = `Poster of ${title ?? ""}`;
  modalCategory.textContent = category ?? "";
  modalTitle.textContent = title ?? "";
  modalDescription.textContent = description ?? "";
  modalYear.textContent = year ?? "";
  modalDirector.textContent = director ?? "";
  modalDuration.textContent = duration ?? "";
  modalRating.textContent = rating ?? "";

  modalOverlay.classList.add("active");
  document.body.classList.add("no-scroll");
}

export function closeModal(): void {
  modalOverlay.classList.remove("active");
  document.body.classList.remove("no-scroll");
}

export function initializeModal(): void {
  modalClose.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
}
