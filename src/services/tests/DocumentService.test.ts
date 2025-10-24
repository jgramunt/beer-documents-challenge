import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentService } from "../DocumentService.js";
import type { Document } from "../../models/Document.js";

// Mock dependencies
vi.mock("../../utils/logger.js", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("DocumentService", () => {
  let documentService: DocumentService;
  let mockLocalStorage: any;

  // Sample test data
  const apiDocuments: Document[] = [
    {
      ID: "api-1",
      Title: "API Document 1",
      Version: "1.0.0",
      CreatedAt: "2024-01-01",
      UpdatedAt: "2024-01-01",
      Contributors: [{ ID: "1", Name: "John Doe" }],
      Attachments: [],
    },
    {
      ID: "api-2",
      Title: "API Document 2",
      Version: "2.0.0",
      CreatedAt: "2024-01-02",
      UpdatedAt: "2024-01-02",
      Contributors: [{ ID: "2", Name: "Jane Smith" }],
      Attachments: ["file.pdf"],
    },
  ];

  const userDocuments: Document[] = [
    {
      ID: "user-1",
      Title: "User Document",
      Version: "1.0.0",
      CreatedAt: "2024-01-03",
      UpdatedAt: "2024-01-03",
      Contributors: [{ ID: "3", Name: "User" }],
      Attachments: [],
      isUserCreated: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });

    documentService = new DocumentService();
  });

  describe("getDocuments", () => {
    it("should fetch documents from API and merge with user documents", async () => {
      // Setup successful API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(apiDocuments),
      });

      // Setup cached user documents
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userDocuments));

      const result = await documentService.getDocuments();

      expect(mockFetch).toHaveBeenCalledWith("http://localhost:8080/documents");
      expect(result).toHaveLength(3); // 2 API + 1 user document
      expect(result).toEqual([...userDocuments, ...apiDocuments]);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "documents_cache",
        JSON.stringify(result)
      );
      expect(documentService.isOffline()).toBe(false);
    });

    it("should handle empty cache when fetching from API", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(apiDocuments),
      });

      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await documentService.getDocuments();

      expect(result).toEqual(apiDocuments);
      expect(result).toHaveLength(2);
    });

    it("should handle API errors and fallback to cache", async () => {
      const { logger } = await import("../../utils/logger.js");

      // Setup API failure
      const apiError = new Error("Network error");
      mockFetch.mockRejectedValue(apiError);

      // Setup cached documents
      const cachedDocuments = [...userDocuments, ...apiDocuments];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedDocuments));

      const result = await documentService.getDocuments();

      expect(logger.error).toHaveBeenCalledWith("DocumentService", apiError);
      expect(logger.warn).toHaveBeenCalledWith(
        "DocumentService",
        "Using cached documents (offline mode)"
      );
      expect(result).toEqual(cachedDocuments);
      expect(documentService.isOffline()).toBe(true);
    });

    it("should handle HTTP error responses and fallback to cache", async () => {
      const { logger } = await import("../../utils/logger.js");

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const cachedDocuments = [userDocuments[0]];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedDocuments));

      const result = await documentService.getDocuments();

      expect(logger.error).toHaveBeenCalledWith(
        "DocumentService",
        expect.any(Error)
      );
      expect(logger.warn).toHaveBeenCalledWith(
        "DocumentService",
        "Using cached documents (offline mode)"
      );
      expect(result).toEqual(cachedDocuments);
      expect(documentService.isOffline()).toBe(true);
    });

    it("should throw error when API fails and no cache is available", async () => {
      const { logger } = await import("../../utils/logger.js");

      const apiError = new Error("Network error");
      mockFetch.mockRejectedValue(apiError);
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(documentService.getDocuments()).rejects.toThrow(
        "Network error"
      );
      expect(logger.error).toHaveBeenCalledWith("DocumentService", apiError);
      expect(logger.warn).not.toHaveBeenCalledWith(
        "DocumentService",
        "Using cached documents (offline mode)"
      );
    });

    it("should handle JSON parsing errors from API", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userDocuments));

      const result = await documentService.getDocuments();

      expect(result).toEqual(userDocuments);
      expect(documentService.isOffline()).toBe(true);
    });
  });

  describe("isOffline", () => {
    it("should return false initially", () => {
      expect(documentService.isOffline()).toBe(false);
    });

    it("should return true after using cache due to API failure", async () => {
      mockFetch.mockRejectedValue(new Error("API failed"));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userDocuments));

      await documentService.getDocuments();

      expect(documentService.isOffline()).toBe(true);
    });

    it("should return false after successful API call", async () => {
      // First make it offline
      mockFetch.mockRejectedValue(new Error("API failed"));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userDocuments));
      await documentService.getDocuments();
      expect(documentService.isOffline()).toBe(true);

      // Then make successful API call
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(apiDocuments),
      });
      await documentService.getDocuments();
      expect(documentService.isOffline()).toBe(false);
    });
  });

  describe("addToCache", () => {
    it("should add document to cache with isUserCreated flag", () => {
      const existingDocs = [userDocuments[0]];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingDocs));

      const newDoc: Document = {
        ID: "new-1",
        Title: "New Document",
        Version: "1.0.0",
        CreatedAt: "2024-01-04",
        UpdatedAt: "2024-01-04",
        Contributors: [],
        Attachments: [],
      };

      documentService.addToCache(newDoc);

      expect(newDoc.isUserCreated).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "documents_cache",
        JSON.stringify([...existingDocs, newDoc])
      );
    });

    it("should add document to empty cache", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const newDoc: Document = {
        ID: "new-1",
        Title: "New Document",
        Version: "1.0.0",
        CreatedAt: "2024-01-04",
        UpdatedAt: "2024-01-04",
        Contributors: [],
        Attachments: [],
      };

      documentService.addToCache(newDoc);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "documents_cache",
        JSON.stringify([newDoc])
      );
    });

    it("should handle cache errors gracefully", async () => {
      const { logger } = await import("../../utils/logger.js");

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const newDoc: Document = {
        ID: "new-1",
        Title: "New Document",
        Version: "1.0.0",
        CreatedAt: "2024-01-04",
        UpdatedAt: "2024-01-04",
        Contributors: [],
        Attachments: [],
      };

      expect(() => documentService.addToCache(newDoc)).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith(
        "DocumentService",
        "Failed to save documents to cache"
      );
    });

    it("should handle addToCache specific errors", async () => {
      const { logger } = await import("../../utils/logger.js");

      // Mock getFromCache to succeed but saveToCache to fail
      vi.spyOn(documentService as any, "getFromCache").mockReturnValue([]);
      vi.spyOn(documentService as any, "saveToCache").mockImplementation(() => {
        throw new Error("Save failed");
      });

      const newDoc: Document = {
        ID: "new-1",
        Title: "New Document",
        Version: "1.0.0",
        CreatedAt: "2024-01-04",
        UpdatedAt: "2024-01-04",
        Contributors: [],
        Attachments: [],
      };

      expect(() => documentService.addToCache(newDoc)).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith(
        "DocumentService",
        "Failed to add document to cache"
      );
    });
  });

  describe("removeFromCache", () => {
    it("should remove document from cache by ID", () => {
      const docs = [...userDocuments, ...apiDocuments];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(docs));

      documentService.removeFromCache("api-1");

      const expectedDocs = docs.filter((doc) => doc.ID !== "api-1");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "documents_cache",
        JSON.stringify(expectedDocs)
      );
    });

    it("should handle removing non-existent document", () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userDocuments));

      documentService.removeFromCache("non-existent");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "documents_cache",
        JSON.stringify(userDocuments)
      );
    });

    it("should handle empty cache when removing", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      documentService.removeFromCache("any-id");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "documents_cache",
        JSON.stringify([])
      );
    });

    it("should handle cache removal errors gracefully", async () => {
      const { logger } = await import("../../utils/logger.js");

      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify([apiDocuments[0]])
      );
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      expect(() => documentService.removeFromCache("api-1")).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith(
        "DocumentService",
        "Failed to save documents to cache"
      );
    });

    it("should handle removeFromCache specific errors", async () => {
      const { logger } = await import("../../utils/logger.js");

      // Mock getFromCache to succeed but saveToCache to fail
      vi.spyOn(documentService as any, "getFromCache").mockReturnValue([
        apiDocuments[0],
      ]);
      vi.spyOn(documentService as any, "saveToCache").mockImplementation(() => {
        throw new Error("Save failed");
      });

      expect(() => documentService.removeFromCache("api-1")).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith(
        "DocumentService",
        "Failed to remove document from cache"
      );
    });
  });

  describe("cache operations", () => {
    it("should handle localStorage setItem errors", async () => {
      const { logger } = await import("../../utils/logger.js");

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(apiDocuments),
      });

      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const result = await documentService.getDocuments();

      expect(result).toEqual(apiDocuments);
      expect(logger.warn).toHaveBeenCalledWith(
        "DocumentService",
        "Failed to save documents to cache"
      );
    });

    it("should handle localStorage getItem JSON parsing errors", async () => {
      const { logger } = await import("../../utils/logger.js");

      mockFetch.mockRejectedValue(new Error("API failed"));
      mockLocalStorage.getItem.mockReturnValue("invalid json");

      await expect(documentService.getDocuments()).rejects.toThrow(
        "API failed"
      );
      expect(logger.warn).toHaveBeenCalledWith(
        "DocumentService",
        "Failed to retrieve documents from cache"
      );
    });

    it("should filter and return only user-created documents from cache", async () => {
      const mixedDocs = [
        { ...apiDocuments[0] }, // No isUserCreated flag
        { ...userDocuments[0], isUserCreated: true },
        { ...apiDocuments[1], isUserCreated: false },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mixedDocs));
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      const result = await documentService.getDocuments();

      // Should only include the user-created document
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(userDocuments[0]);
    });
  });

  describe("edge cases", () => {
    it("should handle malformed cache data", () => {
      mockLocalStorage.getItem.mockReturnValue('{"invalid": json}');

      const newDoc: Document = {
        ID: "new-1",
        Title: "New Document",
        Version: "1.0.0",
        CreatedAt: "2024-01-04",
        UpdatedAt: "2024-01-04",
        Contributors: [],
        Attachments: [],
      };

      expect(() => documentService.addToCache(newDoc)).not.toThrow();
    });

    it("should handle fetch network timeout", async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 100)
          )
      );

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userDocuments));

      const result = await documentService.getDocuments();
      expect(result).toEqual(userDocuments);
      expect(documentService.isOffline()).toBe(true);
    });
  });
});
