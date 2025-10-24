import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { DocumentController } from "../DocumentController.js";
import type { Document } from "../../models/Document.js";
import type { FormData } from "../../components/FormHandler.js";

// Create mock instances
const mockDocumentService = {
  getDocuments: vi.fn(),
  isOffline: vi.fn(),
  addToCache: vi.fn(),
  removeFromCache: vi.fn(),
};

const mockDocumentRenderer = {
  setOnDelete: vi.fn(),
  renderDocuments: vi.fn(),
};

const mockSortingService = {
  sortDocuments: vi.fn().mockReturnValue([]),
};

const mockFormHandler = {
  onSubmit: vi.fn(),
};

// Mock all dependencies
vi.mock("../../services/DocumentService.js", () => ({
  DocumentService: vi.fn().mockImplementation(() => mockDocumentService),
}));

vi.mock("../../components/DocumentRenderer.js", () => ({
  DocumentRenderer: vi.fn().mockImplementation(() => mockDocumentRenderer),
}));

vi.mock("../../services/DocumentSortingService.js", () => ({
  DocumentSortingService: vi.fn().mockImplementation(() => mockSortingService),
}));

vi.mock("../../components/FormHandler.js", () => ({
  FormHandler: vi.fn().mockImplementation(() => mockFormHandler),
}));

vi.mock("../../utils/idGenerator.js", () => ({
  generateDocumentId: vi.fn().mockReturnValue("doc-123"),
  generateId: vi.fn().mockReturnValue("id-456"),
}));

vi.mock("../../utils/logger.js", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("DocumentController", () => {
  let documentController: DocumentController;
  let mockSortSelect: HTMLSelectElement;
  let mockOfflineBanner: HTMLElement;

  const sampleDocuments: Document[] = [
    {
      ID: "doc-1",
      Title: "Test Document",
      Version: "1.0.0",
      CreatedAt: "2024-01-01T10:00:00Z",
      UpdatedAt: "2024-01-01T10:00:00Z",
      Contributors: [],
      Attachments: [],
    },
  ];

  beforeEach(() => {
    // Create mock DOM elements
    mockSortSelect = document.createElement("select");
    mockSortSelect.id = "sort";
    mockSortSelect.value = "";

    mockOfflineBanner = document.createElement("div");
    mockOfflineBanner.id = "offline-banner";
    mockOfflineBanner.classList.add("hidden");

    // Add elements to DOM
    document.body.appendChild(mockSortSelect);
    document.body.appendChild(mockOfflineBanner);

    // Create controller
    documentController = new DocumentController();
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with all dependencies", () => {
      expect(documentController).toBeDefined();
      expect(mockDocumentRenderer.setOnDelete).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(mockFormHandler.onSubmit).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it("should throw error when sort select element not found", () => {
      document.body.innerHTML = ""; // Remove sort element

      expect(() => new DocumentController()).toThrow(
        "Sort select element not found"
      );
    });

    it("should throw error when offline banner element not found", () => {
      document.getElementById("offline-banner")?.remove();

      expect(() => new DocumentController()).toThrow(
        "Offline banner element not found"
      );
    });

    it("should setup event listeners for sort select", () => {
      const addEventListener = vi.spyOn(mockSortSelect, "addEventListener");

      new DocumentController();

      expect(addEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function)
      );
    });
  });

  describe("initialize", () => {
    it("should load documents and render them", async () => {
      mockDocumentService.getDocuments.mockResolvedValue(sampleDocuments);
      mockDocumentService.isOffline.mockReturnValue(false);
      mockSortingService.sortDocuments.mockReturnValue(sampleDocuments);

      await documentController.initialize();

      expect(mockDocumentService.getDocuments).toHaveBeenCalled();
      expect(mockSortingService.sortDocuments).toHaveBeenCalledWith(
        sampleDocuments,
        ""
      );
      expect(mockDocumentRenderer.renderDocuments).toHaveBeenCalledWith(
        sampleDocuments
      );
    });

    it("should show offline banner when service is offline", async () => {
      mockDocumentService.getDocuments.mockResolvedValue(sampleDocuments);
      mockDocumentService.isOffline.mockReturnValue(true);
      mockSortingService.sortDocuments.mockReturnValue(sampleDocuments);

      await documentController.initialize();

      expect(mockOfflineBanner.classList.contains("hidden")).toBe(false);
    });

    it("should handle initialization errors", async () => {
      const { logger } = await import("../../utils/logger.js");
      const error = new Error("Network error");
      mockDocumentService.getDocuments.mockRejectedValue(error);

      await documentController.initialize();

      expect(logger.error).toHaveBeenCalledWith("DocumentController", error);
      expect(mockOfflineBanner.classList.contains("hidden")).toBe(false);
    });

    it("should not show offline banner when service is online", async () => {
      mockDocumentService.getDocuments.mockResolvedValue(sampleDocuments);
      mockDocumentService.isOffline.mockReturnValue(false);

      await documentController.initialize();

      expect(mockOfflineBanner.classList.contains("hidden")).toBe(true);
    });
  });

  describe("addDocument", () => {
    it("should add document and update cache", () => {
      const newDoc: Document = {
        ID: "new-doc",
        Title: "New Document",
        Version: "1.0.0",
        CreatedAt: "2024-01-01T10:00:00Z",
        UpdatedAt: "2024-01-01T10:00:00Z",
        Contributors: [],
        Attachments: [],
      };

      mockSortingService.sortDocuments.mockReturnValue([newDoc]);

      documentController.addDocument(newDoc);

      expect(mockDocumentService.addToCache).toHaveBeenCalledWith(newDoc);
      expect(mockSortingService.sortDocuments).toHaveBeenCalledWith(
        [newDoc],
        ""
      );
      expect(mockDocumentRenderer.renderDocuments).toHaveBeenCalledWith([
        newDoc,
      ]);
    });

    it("should add multiple documents", () => {
      const doc1: Document = {
        ID: "doc1",
        Title: "Document 1",
        Version: "1.0.0",
        CreatedAt: "2024-01-01T10:00:00Z",
        UpdatedAt: "2024-01-01T10:00:00Z",
        Contributors: [],
        Attachments: [],
      };

      const doc2: Document = {
        ID: "doc2",
        Title: "Document 2",
        Version: "2.0.0",
        CreatedAt: "2024-01-02T10:00:00Z",
        UpdatedAt: "2024-01-02T10:00:00Z",
        Contributors: [],
        Attachments: [],
      };

      mockSortingService.sortDocuments.mockReturnValue([doc1, doc2]);

      documentController.addDocument(doc1);
      documentController.addDocument(doc2);

      expect(mockDocumentService.addToCache).toHaveBeenCalledTimes(2);
      expect(mockDocumentRenderer.renderDocuments).toHaveBeenCalledTimes(2);
    });
  });

  describe("sort functionality", () => {
    beforeEach(async () => {
      mockDocumentService.getDocuments.mockResolvedValue(sampleDocuments);
      mockDocumentService.isOffline.mockReturnValue(false);
      await documentController.initialize();
      vi.clearAllMocks();
    });

    it("should handle sort change events", () => {
      mockSortSelect.value = "name";
      mockSortingService.sortDocuments.mockReturnValue(sampleDocuments);

      // Create proper change event with target
      Object.defineProperty(mockSortSelect, "value", {
        value: "name",
        writable: true,
      });
      mockSortSelect.dispatchEvent(new Event("change", { bubbles: true }));

      expect(mockSortingService.sortDocuments).toHaveBeenCalledWith(
        sampleDocuments,
        "name"
      );
      expect(mockDocumentRenderer.renderDocuments).toHaveBeenCalledWith(
        sampleDocuments
      );
    });

    it("should handle different sort options", () => {
      const sortOptions = ["", "name", "version", "created"];

      sortOptions.forEach((sortOption) => {
        Object.defineProperty(mockSortSelect, "value", {
          value: sortOption,
          writable: true,
        });
        mockSortingService.sortDocuments.mockReturnValue(sampleDocuments);

        mockSortSelect.dispatchEvent(new Event("change", { bubbles: true }));

        expect(mockSortingService.sortDocuments).toHaveBeenCalledWith(
          sampleDocuments,
          sortOption
        );
      });
    });
  });

  describe("form submission", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should handle new document creation from form", async () => {
      const { generateDocumentId, generateId } = await import(
        "../../utils/idGenerator.js"
      );

      // Mock current time
      const mockDate = new Date("2024-01-01T10:00:00Z");
      vi.setSystemTime(mockDate);

      const formData: FormData = {
        name: "Test Document",
        version: "1.0.0",
        contributors: ["John Doe", "Jane Smith"],
        attachments: ["file1.pdf", "file2.doc"],
      };

      const expectedDocument: Document = {
        ID: "doc-123",
        Title: "Test Document",
        Version: "1.0.0",
        CreatedAt: "2024-01-01T10:00:00.000Z",
        UpdatedAt: "2024-01-01T10:00:00.000Z",
        Contributors: [
          { ID: "id-456", Name: "John Doe" },
          { ID: "id-456", Name: "Jane Smith" },
        ],
        Attachments: ["file1.pdf", "file2.doc"],
      };

      mockSortingService.sortDocuments.mockReturnValue([expectedDocument]);

      // Get the form submit callback and call it
      const submitCallback = mockFormHandler.onSubmit.mock.calls[0][0];
      submitCallback(formData);

      expect(generateDocumentId).toHaveBeenCalled();
      expect(generateId).toHaveBeenCalledTimes(2); // For each contributor
      expect(mockDocumentService.addToCache).toHaveBeenCalledWith(
        expectedDocument
      );
      expect(mockDocumentRenderer.renderDocuments).toHaveBeenCalledWith([
        expectedDocument,
      ]);
    });

    it("should handle form with empty contributors", () => {
      const mockDate = new Date("2024-01-01T10:00:00Z");
      vi.setSystemTime(mockDate);

      const formData: FormData = {
        name: "Test Document",
        version: "1.0.0",
        contributors: [],
        attachments: [],
      };

      const expectedDocument: Document = {
        ID: "doc-123",
        Title: "Test Document",
        Version: "1.0.0",
        CreatedAt: "2024-01-01T10:00:00.000Z",
        UpdatedAt: "2024-01-01T10:00:00.000Z",
        Contributors: [],
        Attachments: [],
      };

      mockSortingService.sortDocuments.mockReturnValue([expectedDocument]);

      const submitCallback = mockFormHandler.onSubmit.mock.calls[0][0];
      submitCallback(formData);

      expect(mockDocumentService.addToCache).toHaveBeenCalledWith(
        expectedDocument
      );
    });
  });

  describe("document deletion", () => {
    let deleteCallback: (docId: string) => void;

    beforeEach(async () => {
      mockDocumentService.getDocuments.mockResolvedValue(sampleDocuments);
      mockDocumentService.isOffline.mockReturnValue(false);
      await documentController.initialize();

      // Get the delete callback from the constructor call
      deleteCallback = mockDocumentRenderer.setOnDelete.mock.calls[0][0];
      vi.clearAllMocks();
    });

    it("should handle document deletion", () => {
      const docId = "doc-1";
      mockSortingService.sortDocuments.mockReturnValue([]);

      deleteCallback(docId);

      expect(mockDocumentService.removeFromCache).toHaveBeenCalledWith(docId);
      expect(mockSortingService.sortDocuments).toHaveBeenCalledWith([], "");
      expect(mockDocumentRenderer.renderDocuments).toHaveBeenCalledWith([]);
    });

    it("should remove document from local array", () => {
      // Add multiple documents first
      const doc2: Document = {
        ID: "doc-2",
        Title: "Document 2",
        Version: "1.0.0",
        CreatedAt: "2024-01-01T10:00:00Z",
        UpdatedAt: "2024-01-01T10:00:00Z",
        Contributors: [],
        Attachments: [],
      };

      documentController.addDocument(doc2);
      vi.clearAllMocks();

      // Now delete doc-1
      const remainingDocs = [doc2];
      mockSortingService.sortDocuments.mockReturnValue(remainingDocs);

      deleteCallback("doc-1");

      expect(mockSortingService.sortDocuments).toHaveBeenCalledWith(
        remainingDocs,
        ""
      );
      expect(mockDocumentRenderer.renderDocuments).toHaveBeenCalledWith(
        remainingDocs
      );
    });

    it("should handle deletion of non-existent document", () => {
      mockSortingService.sortDocuments.mockReturnValue(sampleDocuments);

      deleteCallback("non-existent-id");

      expect(mockDocumentService.removeFromCache).toHaveBeenCalledWith(
        "non-existent-id"
      );
      expect(mockDocumentRenderer.renderDocuments).toHaveBeenCalledWith(
        sampleDocuments
      );
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete workflow: initialize, add, sort, delete", async () => {
      // Initialize
      mockDocumentService.getDocuments.mockResolvedValue([]);
      mockDocumentService.isOffline.mockReturnValue(false);
      await documentController.initialize();

      // Add document
      const newDoc: Document = {
        ID: "new-doc",
        Title: "New Document",
        Version: "1.0.0",
        CreatedAt: "2024-01-01T10:00:00Z",
        UpdatedAt: "2024-01-01T10:00:00Z",
        Contributors: [],
        Attachments: [],
      };

      mockSortingService.sortDocuments.mockReturnValue([newDoc]);
      documentController.addDocument(newDoc);

      // Change sort
      mockSortSelect.value = "name";
      const event = new Event("change");
      mockSortSelect.dispatchEvent(event);

      // Delete document
      mockSortingService.sortDocuments.mockReturnValue([]);
      const deleteCallback = mockDocumentRenderer.setOnDelete.mock.calls[0][0];
      deleteCallback("new-doc");

      // Verify all operations
      expect(mockDocumentService.getDocuments).toHaveBeenCalled();
      expect(mockDocumentService.addToCache).toHaveBeenCalledWith(newDoc);
      expect(mockDocumentService.removeFromCache).toHaveBeenCalledWith(
        "new-doc"
      );
      expect(mockDocumentRenderer.renderDocuments).toHaveBeenCalledTimes(4); // init, add, sort, delete
    });

    it("should maintain state across operations", async () => {
      mockDocumentService.getDocuments.mockResolvedValue(sampleDocuments);
      mockDocumentService.isOffline.mockReturnValue(false);
      await documentController.initialize();

      // Add a document
      const newDoc: Document = {
        ID: "new-doc",
        Title: "New Document",
        Version: "1.0.0",
        CreatedAt: "2024-01-01T10:00:00Z",
        UpdatedAt: "2024-01-01T10:00:00Z",
        Contributors: [],
        Attachments: [],
      };

      const bothDocs = [...sampleDocuments, newDoc];
      mockSortingService.sortDocuments.mockReturnValue(bothDocs);
      documentController.addDocument(newDoc);

      // Verify sorting includes both documents
      expect(mockSortingService.sortDocuments).toHaveBeenCalledWith(
        bothDocs,
        ""
      );
    });
  });
});
