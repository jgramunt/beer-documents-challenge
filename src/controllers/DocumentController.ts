import { Document } from "../models/Document.js";
import { DocumentService } from "../services/DocumentService.js";
import { DocumentRenderer } from "../components/DocumentRenderer.js";
import { FormHandler, type FormData } from "../components/FormHandler.js";
import {
  DocumentSortingService,
  type SortField,
} from "../services/sorting/index.js";
import { generateDocumentId, generateId } from "../utils/idGenerator.js";
import { logger } from "../utils/logger.js";

export class DocumentController {
  private documents: Document[] = [];
  private currentSort: SortField = "";
  private documentService: DocumentService;
  private documentRenderer: DocumentRenderer;
  private sortingService: DocumentSortingService;
  private formHandler: FormHandler;
  private sortSelect: HTMLSelectElement;
  private offlineBanner: HTMLElement;

  constructor() {
    this.documentService = new DocumentService();
    this.documentRenderer = new DocumentRenderer();
    this.sortingService = new DocumentSortingService();
    this.formHandler = new FormHandler();
    this.sortSelect = document.getElementById("sort") as HTMLSelectElement;
    this.offlineBanner = document.getElementById(
      "offline-banner"
    ) as HTMLElement;

    if (!this.sortSelect) {
      throw new Error("Sort select element not found");
    }

    if (!this.offlineBanner) {
      throw new Error("Offline banner element not found");
    }

    this.documentRenderer.setOnDelete((documentId) =>
      this.handleDeleteDocument(documentId)
    );

    this.setupEventListeners();
  }

  public async initialize(): Promise<void> {
    try {
      this.documents = await this.documentService.getDocuments();
      const isOffline = this.documentService.isOffline();
      if (isOffline) {
        this.showOfflineBanner();
      }
      this.renderCurrentDocuments();
    } catch (error) {
      logger.error("DocumentController", error);
      this.showOfflineBanner();
    }
  }

  private showOfflineBanner(): void {
    this.offlineBanner.classList.remove("hidden");
  }

  public addDocument(document: Document): void {
    this.documents.push(document);
    this.documentService.addToCache(document);
    this.renderCurrentDocuments();
  }

  private setupEventListeners(): void {
    this.sortSelect.addEventListener("change", (event) => {
      this.currentSort = (event.target as HTMLSelectElement).value as SortField;
      this.renderCurrentDocuments();
    });

    this.formHandler.onSubmit((formData: FormData) => {
      this.handleNewDocument(formData);
    });
  }

  private handleNewDocument(formData: FormData): void {
    const newDocument: Document = {
      ID: generateDocumentId(),
      Title: formData.name,
      Version: formData.version,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      Contributors: formData.contributors.map((name) => ({
        ID: generateId(),
        Name: name,
      })),
      Attachments: formData.attachments,
    };

    this.addDocument(newDocument);
  }

  private handleDeleteDocument(documentId: string): void {
    this.documents = this.documents.filter((doc) => doc.ID !== documentId);
    this.documentService.removeFromCache(documentId);
    this.renderCurrentDocuments();
  }

  private renderCurrentDocuments(): void {
    const sortedDocuments = this.sortingService.sortDocuments(
      this.documents,
      this.currentSort
    );
    this.documentRenderer.renderDocuments(sortedDocuments);
  }
}
