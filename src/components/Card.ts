import { Document } from "../models/Document.js";
import { escapeHtml } from "../utils/htmlEscaping.js";
import { getRelativeDays } from "../utils/dateFormatter.js";

export class Card {
  private document: Document;
  private element: HTMLElement;
  private onDelete?: (documentId: string) => void;

  constructor(document: Document, onDelete?: (documentId: string) => void) {
    this.document = document;
    this.onDelete = onDelete;
    this.element = this.createElement();
  }

  private createElement(): HTMLElement {
    const card = document.createElement("div");
    card.className = "document-card";
    card.setAttribute("data-id", this.document.ID);

    card.innerHTML = `
      <div class="document-card__header"
        data-id="${this.document.ID}"
        data-created-at="${this.formatDate(this.document.CreatedAt)}"
        data-updated-at="${this.formatDate(this.document.UpdatedAt)}"
      >
          <h3 class="document-card__title">${escapeHtml(
            this.document.Title
          )}</h3>
          
          <span class="document-card__version">Version ${escapeHtml(
            this.document.Version
          )}</span>
          <p class="document-card__relative-date" title="${this.document.CreatedAt.toLocaleString()}">${getRelativeDays(
      this.document.CreatedAt
    )}</p>
      </div>
      <div class="document-card__contributors">
        ${this.document.Contributors.map(
          (contributor) =>
            `<div class="document-card__contributor">${escapeHtml(
              contributor.Name
            )}</div>`
        ).join("")}
      </div>
      <div class="document-card__attachments">
        ${this.document.Attachments.map(
          (attachment) =>
            `<div class="document-card__attachment">${escapeHtml(
              attachment
            )}</div>`
        ).join("")}
      </div>
      ${
        this.onDelete
          ? `
      <button class="document-card__delete-button" title="Delete document" aria-label="Delete document">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
      `
          : ""
      }
    `;

    const deleteButton = card.querySelector(
      ".document-card__delete-button"
    ) as HTMLButtonElement;
    if (deleteButton) {
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.onDelete) {
          this.onDelete(this.document.ID);
        }
      });
    }

    return card;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public getDocument(): Document {
    return this.document;
  }

  public destroy(): void {
    this.element.remove();
  }
}
