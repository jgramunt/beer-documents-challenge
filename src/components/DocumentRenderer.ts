import { Document } from "../models/Document.js";
import { Card } from "./Card.js";

export class DocumentRenderer {
  private tableBody: HTMLElement;
  private addButton: HTMLElement;
  private cards: Card[] = [];
  private onDelete?: (documentId: string) => void;

  constructor() {
    this.tableBody = document.querySelector(".table__body") as HTMLElement;
    this.addButton = document.getElementById(
      "create-card-button"
    ) as HTMLElement;

    this.validateElements();
  }

  private validateElements(): void {
    if (!this.tableBody) {
      throw new Error("Table body element with class 'table__body' not found");
    }
    if (!this.addButton) {
      throw new Error(
        "Add button element with id 'create-card-button' not found"
      );
    }
  }

  public renderDocuments(documents: Document[]): void {
    // Clear existing cards
    this.clearCards();

    // Create and append new cards
    documents.forEach((document) => {
      const card = new Card(document, document.isUserCreated ? this.onDelete : undefined);
      this.cards.push(card);
      this.tableBody.appendChild(card.getElement());
    });

    // Keep the "Add document" button at the end
    this.moveAddButtonToEnd();
  }

  public addDocument(document: Document): void {
    const card = new Card(document);
    this.cards.push(card);

    this.tableBody.insertBefore(card.getElement(), this.addButton);
  }

  public setOnDelete(callback: (documentId: string) => void): void {
    this.onDelete = callback;
  }

  private clearCards(): void {
    this.cards.forEach((card) => card.destroy());
    this.cards = [];
  }

  private moveAddButtonToEnd(): void {
    this.tableBody.appendChild(this.addButton);
  }
}
