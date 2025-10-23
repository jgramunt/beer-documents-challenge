import { Document } from "../models/Document.js";
import { API_CONFIG, CACHE_CONFIG } from "../config/constants.js";
import { logger } from "../utils/logger.js";

export class DocumentService {
  private readonly baseUrl: string = API_CONFIG.BASE_URL;
  private readonly cacheKey: string = CACHE_CONFIG.CACHE_KEY;
  private usedCache: boolean = false;

  async getDocuments(): Promise<Document[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}${API_CONFIG.DOCUMENTS_ENDPOINT}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiFetchedDocuments: Document[] = await response.json();
      const userCreatedDocuments = this.getUserCreatedDocuments();

      const mergedDocuments = [...userCreatedDocuments, ...apiFetchedDocuments];
      this.saveToCache(mergedDocuments);
      this.usedCache = false;
      return mergedDocuments;
    } catch (error) {
      logger.error("DocumentService", error);
      const cached = this.getFromCache();
      if (cached) {
        logger.warn("DocumentService", "Using cached documents (offline mode)");
        this.usedCache = true;
        return cached;
      }
      throw error;
    }
  }

  isOffline(): boolean {
    return this.usedCache;
  }

  addToCache(document: Document): void {
    try {
      document.isUserCreated = true;
      const cached = this.getFromCache() || [];
      cached.push(document);
      this.saveToCache(cached);
    } catch (error) {
      logger.warn("DocumentService", "Failed to add document to cache");
    }
  }

  removeFromCache(documentId: string): void {
    try {
      const cached = this.getFromCache() || [];
      const filtered = cached.filter((doc) => doc.ID !== documentId);
      this.saveToCache(filtered);
    } catch (error) {
      logger.warn("DocumentService", "Failed to remove document from cache");
    }
  }

  private getUserCreatedDocuments(): Document[] {
    const cached = this.getFromCache() || [];
    return cached.filter((doc) => doc.isUserCreated);
  }

  private saveToCache(documents: Document[]): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(documents));
    } catch (error) {
      logger.warn("DocumentService", "Failed to save documents to cache");
    }
  }

  private getFromCache(): Document[] | null {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.warn("DocumentService", "Failed to retrieve documents from cache");
      return null;
    }
  }
}
