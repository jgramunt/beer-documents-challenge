import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DocumentRenderer } from "../DocumentRenderer.js";
import { Document } from "../../models/Document.js";
import { Card } from "../Card.js";

// Mock the Card component
const mockCard = {
  getElement: vi.fn(),
  destroy: vi.fn(),
};

vi.mock("../Card.js", () => ({
  Card: vi.fn().mockImplementation(() => mockCard),
}));

const MockCard = vi.mocked(Card);

describe("DocumentRenderer", () => {
  let documentRenderer: DocumentRenderer;
  let tableBody: HTMLElement;
  let addButton: HTMLElement;
  let mockDocuments: Document[];

  const createMockElements = () => {
    // Create table body
    tableBody = document.createElement("div");
    tableBody.className = "table__body";

    // Create add button
    addButton = document.createElement("button");
    addButton.id = "create-card-button";

    // Add add button to table body initially (as it would be in real HTML)
    tableBody.appendChild(addButton);

    // Add elements to DOM
    document.body.appendChild(tableBody);
  };

  const createMockDocument = (id: string, isUserCreated = false): Document => ({
    ID: id,
    Title: `Document ${id}`,
    Version: "1.0.0",
    CreatedAt: "2023-01-01T00:00:00Z",
    UpdatedAt: "2023-01-02T00:00:00Z",
    Contributors: [
      { ID: "user1", Name: "John Doe" },
      { ID: "user2", Name: "Jane Smith" },
    ],
    Attachments: ["file1.pdf", "file2.doc"],
    isUserCreated,
  });

  beforeEach(() => {
    document.body.innerHTML = "";
    createMockElements();

    mockDocuments = [
      createMockDocument("1"),
      createMockDocument("2", true),
      createMockDocument("3"),
    ];

    // Reset mocks
    vi.clearAllMocks();

    // Setup mock card element
    const mockElement = document.createElement("div");
    mockElement.className = "mock-card";
    mockCard.getElement.mockReturnValue(mockElement);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with required DOM elements", () => {
      expect(() => new DocumentRenderer()).not.toThrow();

      const instance = new DocumentRenderer();
      expect(instance).toBeInstanceOf(DocumentRenderer);
    });

    it("should throw error when table body is missing", () => {
      tableBody.remove();

      expect(() => new DocumentRenderer()).toThrow(
        "Table body element with class 'table__body' not found"
      );
    });

    it("should throw error when add button is missing", () => {
      addButton.remove();

      expect(() => new DocumentRenderer()).toThrow(
        "Add button element with id 'create-card-button' not found"
      );
    });
  });

  describe("Document Rendering", () => {
    beforeEach(() => {
      documentRenderer = new DocumentRenderer();
    });

    it("should render empty document list", () => {
      documentRenderer.renderDocuments([]);

      expect(tableBody.children.length).toBe(1); // Only the add button
      expect(tableBody.contains(addButton)).toBe(true);
    });

    it("should render single document", () => {
      documentRenderer.renderDocuments([mockDocuments[0]]);

      expect(MockCard).toHaveBeenCalledTimes(1);
      expect(MockCard).toHaveBeenCalledWith(mockDocuments[0], undefined);
      expect(mockCard.getElement).toHaveBeenCalledTimes(1);
    });

    it("should render multiple documents", () => {
      documentRenderer.renderDocuments(mockDocuments);

      expect(MockCard).toHaveBeenCalledTimes(3);
      expect(mockCard.getElement).toHaveBeenCalledTimes(3);
    });

    it("should pass delete callback for user-created documents", () => {
      const deleteCallback = vi.fn();
      documentRenderer.setOnDelete(deleteCallback);

      documentRenderer.renderDocuments([mockDocuments[1]]); // User-created document

      expect(MockCard).toHaveBeenCalledWith(mockDocuments[1], deleteCallback);
    });

    it("should not pass delete callback for system documents", () => {
      const deleteCallback = vi.fn();
      documentRenderer.setOnDelete(deleteCallback);

      documentRenderer.renderDocuments([mockDocuments[0]]); // System document

      expect(MockCard).toHaveBeenCalledWith(mockDocuments[0], undefined);
    });

    it("should clear existing cards before rendering new ones", () => {
      // First render
      documentRenderer.renderDocuments([mockDocuments[0]]);
      expect(mockCard.destroy).not.toHaveBeenCalled();

      // Second render should clear previous cards
      documentRenderer.renderDocuments([mockDocuments[1]]);
      expect(mockCard.destroy).toHaveBeenCalledTimes(1);
    });

    it("should move add button to end after rendering", () => {
      documentRenderer.renderDocuments(mockDocuments);

      // Add button should be the last child
      expect(tableBody.lastElementChild).toBe(addButton);
    });

    it("should handle mixed user-created and system documents", () => {
      const deleteCallback = vi.fn();
      documentRenderer.setOnDelete(deleteCallback);

      documentRenderer.renderDocuments(mockDocuments);

      // Check calls for each document
      expect(MockCard).toHaveBeenNthCalledWith(1, mockDocuments[0], undefined); // System
      expect(MockCard).toHaveBeenNthCalledWith(
        2,
        mockDocuments[1],
        deleteCallback
      ); // User-created
      expect(MockCard).toHaveBeenNthCalledWith(3, mockDocuments[2], undefined); // System
    });
  });

  describe("Add Single Document", () => {
    beforeEach(() => {
      documentRenderer = new DocumentRenderer();
    });

    it("should add single document to table", () => {
      documentRenderer.addDocument(mockDocuments[0]);

      expect(MockCard).toHaveBeenCalledTimes(1);
      expect(MockCard).toHaveBeenCalledWith(mockDocuments[0]);
      expect(mockCard.getElement).toHaveBeenCalledTimes(1);
    });

    it("should insert document before add button", () => {
      const mockElement = document.createElement("div");
      mockElement.className = "test-card";
      mockCard.getElement.mockReturnValue(mockElement);

      documentRenderer.addDocument(mockDocuments[0]);

      // Card should be inserted before the add button
      expect(tableBody.contains(mockElement)).toBe(true);
      expect(Array.from(tableBody.children).indexOf(mockElement)).toBeLessThan(
        Array.from(tableBody.children).indexOf(addButton)
      );
    });

    it("should add multiple documents in sequence", () => {
      documentRenderer.addDocument(mockDocuments[0]);
      documentRenderer.addDocument(mockDocuments[1]);

      expect(MockCard).toHaveBeenCalledTimes(2);
      expect(MockCard).toHaveBeenNthCalledWith(1, mockDocuments[0]);
      expect(MockCard).toHaveBeenNthCalledWith(2, mockDocuments[1]);
    });
  });

  describe("Delete Callback Management", () => {
    beforeEach(() => {
      documentRenderer = new DocumentRenderer();
    });

    it("should set delete callback", () => {
      const deleteCallback = vi.fn();

      expect(() => documentRenderer.setOnDelete(deleteCallback)).not.toThrow();
    });

    it("should use delete callback for user-created documents", () => {
      const deleteCallback = vi.fn();

      documentRenderer.setOnDelete(deleteCallback);
      documentRenderer.renderDocuments([mockDocuments[1]]); // User-created

      expect(MockCard).toHaveBeenCalledWith(mockDocuments[1], deleteCallback);
    });

    it("should replace previous delete callback", () => {
      const firstCallback = vi.fn();
      const secondCallback = vi.fn();

      documentRenderer.setOnDelete(firstCallback);
      documentRenderer.setOnDelete(secondCallback);
      documentRenderer.renderDocuments([mockDocuments[1]]); // User-created

      expect(MockCard).toHaveBeenCalledWith(mockDocuments[1], secondCallback);
    });
  });

  describe("Card Management", () => {
    beforeEach(() => {
      documentRenderer = new DocumentRenderer();
    });

    it("should track created cards", () => {
      documentRenderer.renderDocuments(mockDocuments);

      // Should have created 3 cards
      expect(mockCard.getElement).toHaveBeenCalledTimes(3);
    });

    it("should destroy cards when clearing", () => {
      // Render initial documents
      documentRenderer.renderDocuments([mockDocuments[0]]);

      // Render new documents (should clear previous)
      documentRenderer.renderDocuments([mockDocuments[1]]);

      expect(mockCard.destroy).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple clear operations", () => {
      // Multiple render operations
      documentRenderer.renderDocuments([mockDocuments[0]]);
      documentRenderer.renderDocuments([mockDocuments[1]]);
      documentRenderer.renderDocuments([mockDocuments[2]]);

      expect(mockCard.destroy).toHaveBeenCalledTimes(2);
    });
  });

  describe("DOM Manipulation", () => {
    beforeEach(() => {
      documentRenderer = new DocumentRenderer();
    });

    it("should append card elements to table body", () => {
      const mockElement = document.createElement("div");
      mockElement.className = "test-card";
      mockCard.getElement.mockReturnValue(mockElement);

      documentRenderer.renderDocuments([mockDocuments[0]]);

      expect(tableBody.contains(mockElement)).toBe(true);
    });

    it("should maintain add button as last element", () => {
      documentRenderer.renderDocuments(mockDocuments);

      expect(tableBody.lastElementChild).toBe(addButton);
    });

    it("should handle empty renders after documents", () => {
      // Setup mock elements that will be removed by destroy
      const mockElements = [
        document.createElement("div"),
        document.createElement("div"),
        document.createElement("div"),
      ];
      mockElements.forEach((el, i) => {
        el.className = `mock-card-${i}`;
        tableBody.appendChild(el);
      });

      let callCount = 0;
      mockCard.getElement.mockImplementation(() => {
        return mockElements[callCount++];
      });

      // Setup destroy to actually remove elements
      mockCard.destroy.mockImplementation(() => {
        // Find and remove mock elements
        const mockEls = tableBody.querySelectorAll('[class^="mock-card"]');
        mockEls.forEach((el) => el.remove());
      });

      // Render documents first
      documentRenderer.renderDocuments(mockDocuments);
      expect(tableBody.children.length).toBeGreaterThan(1);

      // Render empty array
      documentRenderer.renderDocuments([]);
      expect(tableBody.children.length).toBe(1); // Only add button
      expect(tableBody.contains(addButton)).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      documentRenderer = new DocumentRenderer();
    });

    it("should handle documents with special characters", () => {
      const specialDoc: Document = {
        ...mockDocuments[0],
        ID: 'special<>&"',
        Title: 'Document with <special> & "characters"',
      };

      documentRenderer.renderDocuments([specialDoc]);

      expect(MockCard).toHaveBeenCalledWith(specialDoc, undefined);
    });

    it("should handle documents with empty arrays", () => {
      const emptyDoc: Document = {
        ...mockDocuments[0],
        Contributors: [],
        Attachments: [],
      };

      documentRenderer.renderDocuments([emptyDoc]);

      expect(MockCard).toHaveBeenCalledWith(emptyDoc, undefined);
    });

    it("should handle very large document arrays", () => {
      const largeDocArray = Array.from({ length: 100 }, (_, i) =>
        createMockDocument(`doc-${i}`)
      );

      documentRenderer.renderDocuments(largeDocArray);

      expect(MockCard).toHaveBeenCalledTimes(100);
      expect(mockCard.getElement).toHaveBeenCalledTimes(100);
    });

    it("should handle rapid render operations", () => {
      for (let i = 0; i < 10; i++) {
        documentRenderer.renderDocuments([createMockDocument(`rapid-${i}`)]);
      }

      // Should have destroyed cards from previous renders
      expect(mockCard.destroy).toHaveBeenCalledTimes(9);
    });

    it("should handle add document without delete callback set", () => {
      documentRenderer.addDocument(mockDocuments[1]); // User-created but no callback set

      expect(MockCard).toHaveBeenCalledWith(mockDocuments[1]);
    });

    it("should handle mixed operations (render then add)", () => {
      documentRenderer.renderDocuments([mockDocuments[0]]);
      documentRenderer.addDocument(mockDocuments[1]);

      expect(MockCard).toHaveBeenCalledTimes(2);
      expect(MockCard).toHaveBeenNthCalledWith(1, mockDocuments[0], undefined);
      expect(MockCard).toHaveBeenNthCalledWith(2, mockDocuments[1]);
    });
  });
});
