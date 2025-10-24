import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Card } from "../Card.js";
import { Document } from "../../models/Document.js";

// Mock utilities
vi.mock("../../utils/htmlEscaping.js", () => ({
  escapeHtml: vi.fn((text: string) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }),
}));

vi.mock("../../utils/dateFormatter.js", () => ({
  getRelativeDays: vi.fn((date: string | Date) => {
    const now = new Date();
    const targetDate = typeof date === "string" ? new Date(date) : date;
    const diffTime = Math.abs(now.getTime() - targetDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days ago`;
  }),
}));

describe("Card", () => {
  let mockDocument: Document;
  let card: Card;

  const createMockDocument = (overrides = {}): Document => ({
    ID: "doc-123",
    Title: "Test Document",
    Version: "1.0.0",
    CreatedAt: "2023-01-01T00:00:00Z",
    UpdatedAt: "2023-01-02T00:00:00Z",
    Contributors: [
      { ID: "user1", Name: "John Doe" },
      { ID: "user2", Name: "Jane Smith" },
    ],
    Attachments: ["file1.pdf", "file2.doc"],
    isUserCreated: false,
    ...overrides,
  });

  beforeEach(() => {
    document.body.innerHTML = "";
    mockDocument = createMockDocument();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should create card without delete callback", () => {
      card = new Card(mockDocument);

      expect(card).toBeInstanceOf(Card);
      expect(card.getDocument()).toBe(mockDocument);
    });

    it("should create card with delete callback", () => {
      const deleteCallback = vi.fn();
      card = new Card(mockDocument, deleteCallback);

      expect(card).toBeInstanceOf(Card);
      expect(card.getDocument()).toBe(mockDocument);
    });

    it("should create DOM element on construction", () => {
      card = new Card(mockDocument);
      const element = card.getElement();

      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.className).toBe("document-card");
    });
  });

  describe("Element Creation", () => {
    beforeEach(() => {
      card = new Card(mockDocument);
    });

    it("should set correct data attributes", () => {
      const element = card.getElement();

      expect(element.getAttribute("data-id")).toBe("doc-123");
    });

    it("should render document title", () => {
      const element = card.getElement();
      const titleElement = element.querySelector(".document-card__title");

      expect(titleElement?.textContent).toBe("Test Document");
    });

    it("should render document version", () => {
      const element = card.getElement();
      const versionElement = element.querySelector(".document-card__version");

      expect(versionElement?.textContent).toBe("Version 1.0.0");
    });

    it("should render relative date with title attribute", () => {
      const element = card.getElement();
      const dateElement = element.querySelector(
        ".document-card__relative-date"
      );

      expect(dateElement?.textContent).toContain("days ago");
      expect(dateElement?.getAttribute("title")).toBe("2023-01-01T00:00:00Z");
    });

    it("should set header data attributes", () => {
      const element = card.getElement();
      const headerElement = element.querySelector(".document-card__header");

      expect(headerElement?.getAttribute("data-id")).toBe("doc-123");
      expect(headerElement?.getAttribute("data-created-at")).toBeTruthy();
      expect(headerElement?.getAttribute("data-updated-at")).toBeTruthy();
    });

    it("should render contributors", () => {
      const element = card.getElement();
      const contributorElements = element.querySelectorAll(
        ".document-card__contributor"
      );

      expect(contributorElements.length).toBe(2);
      expect(contributorElements[0].textContent).toBe("John Doe");
      expect(contributorElements[1].textContent).toBe("Jane Smith");
    });

    it("should render attachments", () => {
      const element = card.getElement();
      const attachmentElements = element.querySelectorAll(
        ".document-card__attachment"
      );

      expect(attachmentElements.length).toBe(2);
      expect(attachmentElements[0].textContent).toBe("file1.pdf");
      expect(attachmentElements[1].textContent).toBe("file2.doc");
    });

    it("should not render delete button without callback", () => {
      const element = card.getElement();
      const deleteButton = element.querySelector(
        ".document-card__delete-button"
      );

      expect(deleteButton).toBeNull();
    });
  });

  describe("Delete Button", () => {
    it("should render delete button with callback", () => {
      const deleteCallback = vi.fn();
      card = new Card(mockDocument, deleteCallback);
      const element = card.getElement();
      const deleteButton = element.querySelector(
        ".document-card__delete-button"
      );

      expect(deleteButton).toBeTruthy();
      expect(deleteButton?.getAttribute("title")).toBe("Delete document");
      expect(deleteButton?.getAttribute("aria-label")).toBe("Delete document");
    });

    it("should call delete callback when button is clicked", () => {
      const deleteCallback = vi.fn();
      card = new Card(mockDocument, deleteCallback);
      const element = card.getElement();
      const deleteButton = element.querySelector(
        ".document-card__delete-button"
      ) as HTMLButtonElement;

      deleteButton.click();

      expect(deleteCallback).toHaveBeenCalledTimes(1);
      expect(deleteCallback).toHaveBeenCalledWith("doc-123");
    });

    it("should stop event propagation when delete button is clicked", () => {
      const deleteCallback = vi.fn();
      card = new Card(mockDocument, deleteCallback);
      const element = card.getElement();
      const deleteButton = element.querySelector(
        ".document-card__delete-button"
      ) as HTMLButtonElement;

      const event = new MouseEvent("click", { bubbles: true });
      const stopPropagationSpy = vi.spyOn(event, "stopPropagation");

      deleteButton.dispatchEvent(event);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it("should contain SVG delete icon", () => {
      const deleteCallback = vi.fn();
      card = new Card(mockDocument, deleteCallback);
      const element = card.getElement();
      const deleteButton = element.querySelector(
        ".document-card__delete-button"
      ) as HTMLButtonElement;
      const svg = deleteButton.querySelector("svg");

      expect(svg).toBeTruthy();
      expect(svg?.getAttribute("width")).toBe("16");
      expect(svg?.getAttribute("height")).toBe("16");
    });
  });

  describe("Date Formatting", () => {
    it("should format dates correctly", () => {
      const testDoc = createMockDocument({
        CreatedAt: "2023-01-15T10:30:00Z",
        UpdatedAt: "2023-01-20T15:45:00Z",
      });
      card = new Card(testDoc);
      const element = card.getElement();
      const headerElement = element.querySelector(".document-card__header");

      const createdAt = headerElement?.getAttribute("data-created-at");
      const updatedAt = headerElement?.getAttribute("data-updated-at");

      expect(createdAt).toMatch(/Jan \d+, 2023/);
      expect(updatedAt).toMatch(/Jan \d+, 2023/);
    });

    it("should handle invalid dates gracefully", () => {
      const testDoc = createMockDocument({
        CreatedAt: "invalid-date",
        UpdatedAt: "also-invalid",
      });
      card = new Card(testDoc);
      const element = card.getElement();
      const headerElement = element.querySelector(".document-card__header");

      expect(headerElement?.getAttribute("data-created-at")).toBeTruthy();
      expect(headerElement?.getAttribute("data-updated-at")).toBeTruthy();
    });
  });

  describe("HTML Escaping", () => {
    it("should escape HTML in title", () => {
      const testDoc = createMockDocument({
        Title: '<script>alert("xss")</script>',
      });
      card = new Card(testDoc);
      const element = card.getElement();
      const titleElement = element.querySelector(".document-card__title");

      expect(titleElement?.innerHTML).toBe(
        '&lt;script&gt;alert("xss")&lt;/script&gt;'
      );
    });

    it("should escape HTML in version", () => {
      const testDoc = createMockDocument({
        Version: "<b>1.0.0</b>",
      });
      card = new Card(testDoc);
      const element = card.getElement();
      const versionElement = element.querySelector(".document-card__version");

      expect(versionElement?.innerHTML).toContain("&lt;b&gt;1.0.0&lt;/b&gt;");
    });

    it("should escape HTML in contributor names", () => {
      const testDoc = createMockDocument({
        Contributors: [
          { ID: "user1", Name: "<b>John</b> Doe" },
          { ID: "user2", Name: "Jane & Smith" },
        ],
      });
      card = new Card(testDoc);
      const element = card.getElement();
      const contributorElements = element.querySelectorAll(
        ".document-card__contributor"
      );

      expect(contributorElements[0].innerHTML).toBe(
        "&lt;b&gt;John&lt;/b&gt; Doe"
      );
      expect(contributorElements[1].innerHTML).toBe("Jane &amp; Smith");
    });

    it("should escape HTML in attachment names", () => {
      const testDoc = createMockDocument({
        Attachments: ["<script>file.pdf</script>", "normal & file.doc"],
      });
      card = new Card(testDoc);
      const element = card.getElement();
      const attachmentElements = element.querySelectorAll(
        ".document-card__attachment"
      );

      expect(attachmentElements[0].innerHTML).toBe(
        "&lt;script&gt;file.pdf&lt;/script&gt;"
      );
      expect(attachmentElements[1].innerHTML).toBe("normal &amp; file.doc");
    });
  });

  describe("Empty Data Handling", () => {
    it("should handle empty contributors array", () => {
      const testDoc = createMockDocument({
        Contributors: [],
      });
      card = new Card(testDoc);
      const element = card.getElement();
      const contributorsContainer = element.querySelector(
        ".document-card__contributors"
      );
      const contributorElements = element.querySelectorAll(
        ".document-card__contributor"
      );

      expect(contributorsContainer).toBeTruthy();
      expect(contributorElements.length).toBe(0);
    });

    it("should handle empty attachments array", () => {
      const testDoc = createMockDocument({
        Attachments: [],
      });
      card = new Card(testDoc);
      const element = card.getElement();
      const attachmentsContainer = element.querySelector(
        ".document-card__attachments"
      );
      const attachmentElements = element.querySelectorAll(
        ".document-card__attachment"
      );

      expect(attachmentsContainer).toBeTruthy();
      expect(attachmentElements.length).toBe(0);
    });

    it("should handle empty title", () => {
      const testDoc = createMockDocument({
        Title: "",
      });
      card = new Card(testDoc);
      const element = card.getElement();
      const titleElement = element.querySelector(".document-card__title");

      expect(titleElement?.textContent).toBe("");
    });

    it("should handle empty version", () => {
      const testDoc = createMockDocument({
        Version: "",
      });
      card = new Card(testDoc);
      const element = card.getElement();
      const versionElement = element.querySelector(".document-card__version");

      expect(versionElement?.textContent).toBe("Version ");
    });
  });

  describe("Public Methods", () => {
    beforeEach(() => {
      card = new Card(mockDocument);
    });

    it("should return element via getElement", () => {
      const element = card.getElement();

      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.className).toBe("document-card");
    });

    it("should return document via getDocument", () => {
      const document = card.getDocument();

      expect(document).toBe(mockDocument);
    });

    it("should remove element from DOM on destroy", () => {
      const element = card.getElement();
      document.body.appendChild(element);

      expect(document.body.contains(element)).toBe(true);

      card.destroy();

      expect(document.body.contains(element)).toBe(false);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle document with many contributors", () => {
      const manyContributors = Array.from({ length: 10 }, (_, i) => ({
        ID: `user${i}`,
        Name: `User ${i}`,
      }));
      const testDoc = createMockDocument({
        Contributors: manyContributors,
      });
      card = new Card(testDoc);
      const element = card.getElement();
      const contributorElements = element.querySelectorAll(
        ".document-card__contributor"
      );

      expect(contributorElements.length).toBe(10);
      expect(contributorElements[9].textContent).toBe("User 9");
    });

    it("should handle document with many attachments", () => {
      const manyAttachments = Array.from(
        { length: 5 },
        (_, i) => `file${i}.pdf`
      );
      const testDoc = createMockDocument({
        Attachments: manyAttachments,
      });
      card = new Card(testDoc);
      const element = card.getElement();
      const attachmentElements = element.querySelectorAll(
        ".document-card__attachment"
      );

      expect(attachmentElements.length).toBe(5);
      expect(attachmentElements[4].textContent).toBe("file4.pdf");
    });

    it("should handle very long document title", () => {
      const longTitle = "A".repeat(200);
      const testDoc = createMockDocument({
        Title: longTitle,
      });
      card = new Card(testDoc);
      const element = card.getElement();
      const titleElement = element.querySelector(".document-card__title");

      expect(titleElement?.textContent).toBe(longTitle);
    });

    it("should handle special characters in all fields", () => {
      const testDoc = createMockDocument({
        ID: "doc-with-special-chars-&-<>",
        Title: "Title with & < > \" ' characters",
        Version: "1.0.0-beta+special",
        Contributors: [{ ID: "user1", Name: "Name with & < >" }],
        Attachments: ["file&name<>.pdf"],
      });
      card = new Card(testDoc);
      const element = card.getElement();

      expect(element.getAttribute("data-id")).toBe(
        "doc-with-special-chars-&-<>"
      );
      expect(
        element.querySelector(".document-card__title")?.innerHTML
      ).toContain("&amp;");
      expect(
        element.querySelector(".document-card__contributor")?.innerHTML
      ).toContain("&amp;");
      expect(
        element.querySelector(".document-card__attachment")?.innerHTML
      ).toContain("&amp;");
    });

    it("should handle multiple delete button clicks", () => {
      const deleteCallback = vi.fn();
      card = new Card(mockDocument, deleteCallback);
      const element = card.getElement();
      const deleteButton = element.querySelector(
        ".document-card__delete-button"
      ) as HTMLButtonElement;

      deleteButton.click();
      deleteButton.click();
      deleteButton.click();

      expect(deleteCallback).toHaveBeenCalledTimes(3);
      expect(deleteCallback).toHaveBeenCalledWith("doc-123");
    });

    it("should maintain element integrity after multiple operations", () => {
      const deleteCallback = vi.fn();
      card = new Card(mockDocument, deleteCallback);
      const element = card.getElement();

      // Test various operations
      document.body.appendChild(element);
      expect(document.body.contains(element)).toBe(true);

      const deleteButton = element.querySelector(
        ".document-card__delete-button"
      ) as HTMLButtonElement;
      deleteButton.click();
      expect(deleteCallback).toHaveBeenCalled();

      // Element should still be in DOM until destroy is called
      expect(document.body.contains(element)).toBe(true);

      card.destroy();
      expect(document.body.contains(element)).toBe(false);
    });
  });
});
