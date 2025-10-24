import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TableViewHandler } from "../TableViewHandler.js";

describe("TableViewHandler", () => {
  let tableViewHandler: TableViewHandler;
  let mockTableElement: HTMLElement;
  let mockListViewButton: HTMLElement;
  let mockGridViewButton: HTMLElement;

  beforeEach(() => {
    // Create mock DOM elements
    mockTableElement = document.createElement("div");
    mockTableElement.id = "main-table";
    mockTableElement.classList.add("list-view"); // Default to list view

    mockListViewButton = document.createElement("button");
    mockListViewButton.id = "list-view";
    mockListViewButton.classList.add("active");
    mockListViewButton.setAttribute("aria-pressed", "true");

    mockGridViewButton = document.createElement("button");
    mockGridViewButton.id = "grid-view";
    mockGridViewButton.setAttribute("aria-pressed", "false");

    // Add elements to DOM
    document.body.appendChild(mockTableElement);
    document.body.appendChild(mockListViewButton);
    document.body.appendChild(mockGridViewButton);

    // Create instance
    tableViewHandler = new TableViewHandler();
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = "";
  });

  describe("constructor", () => {
    it("should initialize with required DOM elements", () => {
      expect(tableViewHandler).toBeDefined();
    });

    it("should throw error when table element not found", () => {
      document.body.innerHTML = ""; // Remove all elements

      expect(() => new TableViewHandler()).toThrow(
        "Table element with id 'main-table' not found"
      );
    });

    it("should throw error when list view button not found", () => {
      mockListViewButton.remove();

      expect(() => new TableViewHandler()).toThrow(
        "List view button with id 'list-view' not found"
      );
    });

    it("should throw error when grid view button not found", () => {
      mockGridViewButton.remove();

      expect(() => new TableViewHandler()).toThrow(
        "Grid view button with id 'grid-view' not found"
      );
    });

    it("should setup event listeners on buttons", () => {
      // Event listeners are set up during construction
      // We can verify by triggering click events
      expect(mockListViewButton.onclick).toBeDefined;
      expect(mockGridViewButton.onclick).toBeDefined;
    });
  });

  describe("view switching", () => {
    it("should switch to grid view when grid button is clicked", () => {
      // Start in list view
      expect(tableViewHandler.getCurrentView()).toBe("list");

      // Click grid view button
      mockGridViewButton.click();

      expect(mockTableElement.classList.contains("grid-view")).toBe(true);
      expect(mockTableElement.classList.contains("list-view")).toBe(false);
      expect(mockGridViewButton.classList.contains("active")).toBe(true);
      expect(mockGridViewButton.getAttribute("aria-pressed")).toBe("true");
      expect(mockListViewButton.classList.contains("active")).toBe(false);
      expect(mockListViewButton.getAttribute("aria-pressed")).toBe("false");
    });

    it("should switch to list view when list button is clicked", () => {
      // Start in grid view
      mockTableElement.classList.remove("list-view");
      mockTableElement.classList.add("grid-view");
      mockGridViewButton.classList.add("active");
      mockListViewButton.classList.remove("active");

      expect(tableViewHandler.getCurrentView()).toBe("grid");

      // Click list view button
      mockListViewButton.click();

      expect(mockTableElement.classList.contains("list-view")).toBe(true);
      expect(mockTableElement.classList.contains("grid-view")).toBe(false);
      expect(mockListViewButton.classList.contains("active")).toBe(true);
      expect(mockListViewButton.getAttribute("aria-pressed")).toBe("true");
      expect(mockGridViewButton.classList.contains("active")).toBe(false);
      expect(mockGridViewButton.getAttribute("aria-pressed")).toBe("false");
    });

    it("should handle multiple view switches", () => {
      // Switch to grid
      mockGridViewButton.click();
      expect(tableViewHandler.getCurrentView()).toBe("grid");

      // Switch back to list
      mockListViewButton.click();
      expect(tableViewHandler.getCurrentView()).toBe("list");

      // Switch to grid again
      mockGridViewButton.click();
      expect(tableViewHandler.getCurrentView()).toBe("grid");

      // Switch back to list again
      mockListViewButton.click();
      expect(tableViewHandler.getCurrentView()).toBe("list");
    });

    it("should handle clicking same view button multiple times", () => {
      // Click list view button multiple times
      mockListViewButton.click();
      mockListViewButton.click();
      mockListViewButton.click();

      expect(tableViewHandler.getCurrentView()).toBe("list");
      expect(mockListViewButton.classList.contains("active")).toBe(true);
      expect(mockGridViewButton.classList.contains("active")).toBe(false);
    });
  });

  describe("getCurrentView", () => {
    it('should return "list" when in list view', () => {
      mockTableElement.classList.remove("grid-view");
      mockTableElement.classList.add("list-view");

      expect(tableViewHandler.getCurrentView()).toBe("list");
    });

    it('should return "grid" when in grid view', () => {
      mockTableElement.classList.remove("list-view");
      mockTableElement.classList.add("grid-view");

      expect(tableViewHandler.getCurrentView()).toBe("grid");
    });

    it('should return "list" when no view class is present', () => {
      mockTableElement.classList.remove("list-view");
      mockTableElement.classList.remove("grid-view");

      expect(tableViewHandler.getCurrentView()).toBe("list");
    });

    it('should return "grid" when grid-view class is present regardless of list-view', () => {
      mockTableElement.classList.add("list-view");
      mockTableElement.classList.add("grid-view");

      expect(tableViewHandler.getCurrentView()).toBe("grid");
    });
  });

  describe("setView", () => {
    it("should programmatically set to list view", () => {
      // Start in grid view
      mockTableElement.classList.add("grid-view");
      mockGridViewButton.classList.add("active");
      mockListViewButton.classList.remove("active");

      tableViewHandler.setView("list");

      expect(mockTableElement.classList.contains("list-view")).toBe(true);
      expect(mockTableElement.classList.contains("grid-view")).toBe(false);
      expect(mockListViewButton.classList.contains("active")).toBe(true);
      expect(mockGridViewButton.classList.contains("active")).toBe(false);
      expect(tableViewHandler.getCurrentView()).toBe("list");
    });

    it("should programmatically set to grid view", () => {
      // Start in list view
      mockTableElement.classList.add("list-view");
      mockListViewButton.classList.add("active");
      mockGridViewButton.classList.remove("active");

      tableViewHandler.setView("grid");

      expect(mockTableElement.classList.contains("grid-view")).toBe(true);
      expect(mockTableElement.classList.contains("list-view")).toBe(false);
      expect(mockGridViewButton.classList.contains("active")).toBe(true);
      expect(mockListViewButton.classList.contains("active")).toBe(false);
      expect(tableViewHandler.getCurrentView()).toBe("grid");
    });

    it("should handle setting same view multiple times", () => {
      tableViewHandler.setView("grid");
      tableViewHandler.setView("grid");
      tableViewHandler.setView("grid");

      expect(tableViewHandler.getCurrentView()).toBe("grid");
      expect(mockGridViewButton.classList.contains("active")).toBe(true);
    });

    it("should handle rapid view changes", () => {
      tableViewHandler.setView("grid");
      expect(tableViewHandler.getCurrentView()).toBe("grid");

      tableViewHandler.setView("list");
      expect(tableViewHandler.getCurrentView()).toBe("list");

      tableViewHandler.setView("grid");
      expect(tableViewHandler.getCurrentView()).toBe("grid");

      tableViewHandler.setView("list");
      expect(tableViewHandler.getCurrentView()).toBe("list");
    });
  });

  describe("accessibility attributes", () => {
    it("should set correct aria-pressed attributes in list view", () => {
      tableViewHandler.setView("list");

      expect(mockListViewButton.getAttribute("aria-pressed")).toBe("true");
      expect(mockGridViewButton.getAttribute("aria-pressed")).toBe("false");
    });

    it("should set correct aria-pressed attributes in grid view", () => {
      tableViewHandler.setView("grid");

      expect(mockGridViewButton.getAttribute("aria-pressed")).toBe("true");
      expect(mockListViewButton.getAttribute("aria-pressed")).toBe("false");
    });

    it("should maintain aria-pressed consistency through view changes", () => {
      // Start in list
      tableViewHandler.setView("list");
      expect(mockListViewButton.getAttribute("aria-pressed")).toBe("true");
      expect(mockGridViewButton.getAttribute("aria-pressed")).toBe("false");

      // Switch to grid
      tableViewHandler.setView("grid");
      expect(mockGridViewButton.getAttribute("aria-pressed")).toBe("true");
      expect(mockListViewButton.getAttribute("aria-pressed")).toBe("false");

      // Switch back to list
      tableViewHandler.setView("list");
      expect(mockListViewButton.getAttribute("aria-pressed")).toBe("true");
      expect(mockGridViewButton.getAttribute("aria-pressed")).toBe("false");
    });
  });

  describe("CSS class management", () => {
    it("should properly manage CSS classes when switching to list view", () => {
      mockTableElement.classList.add("grid-view");
      mockTableElement.classList.add("some-other-class");

      tableViewHandler.setView("list");

      expect(mockTableElement.classList.contains("list-view")).toBe(true);
      expect(mockTableElement.classList.contains("grid-view")).toBe(false);
      expect(mockTableElement.classList.contains("some-other-class")).toBe(
        true
      ); // Other classes preserved
    });

    it("should properly manage CSS classes when switching to grid view", () => {
      mockTableElement.classList.add("list-view");
      mockTableElement.classList.add("some-other-class");

      tableViewHandler.setView("grid");

      expect(mockTableElement.classList.contains("grid-view")).toBe(true);
      expect(mockTableElement.classList.contains("list-view")).toBe(false);
      expect(mockTableElement.classList.contains("some-other-class")).toBe(
        true
      ); // Other classes preserved
    });

    it("should handle elements with multiple CSS classes", () => {
      mockTableElement.className = "table main-content list-view active";
      mockListViewButton.className = "btn btn-primary active";
      mockGridViewButton.className = "btn btn-secondary";

      tableViewHandler.setView("grid");

      expect(mockTableElement.classList.contains("grid-view")).toBe(true);
      expect(mockTableElement.classList.contains("list-view")).toBe(false);
      expect(mockTableElement.classList.contains("table")).toBe(true);
      expect(mockTableElement.classList.contains("main-content")).toBe(true);
      expect(mockTableElement.classList.contains("active")).toBe(true);

      expect(mockGridViewButton.classList.contains("active")).toBe(true);
      expect(mockGridViewButton.classList.contains("btn")).toBe(true);
      expect(mockGridViewButton.classList.contains("btn-secondary")).toBe(true);

      expect(mockListViewButton.classList.contains("active")).toBe(false);
      expect(mockListViewButton.classList.contains("btn")).toBe(true);
      expect(mockListViewButton.classList.contains("btn-primary")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle elements with no initial classes", () => {
      // Remove all classes
      mockTableElement.className = "";
      mockListViewButton.className = "";
      mockGridViewButton.className = "";

      tableViewHandler.setView("grid");

      expect(mockTableElement.classList.contains("grid-view")).toBe(true);
      expect(mockGridViewButton.classList.contains("active")).toBe(true);
      expect(mockGridViewButton.getAttribute("aria-pressed")).toBe("true");
    });

    it("should handle switching to current view", () => {
      // Set to list view
      tableViewHandler.setView("list");
      const initialClasses = mockTableElement.className;

      // Set to list view again
      tableViewHandler.setView("list");

      expect(mockTableElement.className).toBe(initialClasses);
      expect(tableViewHandler.getCurrentView()).toBe("list");
    });

    it("should handle missing aria-pressed attributes", () => {
      // Remove aria-pressed attributes
      mockListViewButton.removeAttribute("aria-pressed");
      mockGridViewButton.removeAttribute("aria-pressed");

      tableViewHandler.setView("grid");

      expect(mockGridViewButton.getAttribute("aria-pressed")).toBe("true");
      expect(mockListViewButton.getAttribute("aria-pressed")).toBe("false");
    });

    it("should work with dynamically created elements", () => {
      // Create new elements dynamically
      const newTable = document.createElement("div");
      newTable.id = "main-table";
      const newListBtn = document.createElement("button");
      newListBtn.id = "list-view";
      const newGridBtn = document.createElement("button");
      newGridBtn.id = "grid-view";

      // Replace existing elements
      document.body.innerHTML = "";
      document.body.appendChild(newTable);
      document.body.appendChild(newListBtn);
      document.body.appendChild(newGridBtn);

      const newHandler = new TableViewHandler();

      newHandler.setView("grid");

      expect(newTable.classList.contains("grid-view")).toBe(true);
      expect(newGridBtn.classList.contains("active")).toBe(true);
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete user interaction flow", () => {
      // User clicks grid view
      mockGridViewButton.click();
      expect(tableViewHandler.getCurrentView()).toBe("grid");

      // User clicks list view
      mockListViewButton.click();
      expect(tableViewHandler.getCurrentView()).toBe("list");

      // Programmatic change to grid
      tableViewHandler.setView("grid");
      expect(tableViewHandler.getCurrentView()).toBe("grid");

      // User clicks grid again (no change)
      mockGridViewButton.click();
      expect(tableViewHandler.getCurrentView()).toBe("grid");

      // Programmatic change to list
      tableViewHandler.setView("list");
      expect(tableViewHandler.getCurrentView()).toBe("list");
    });

    it("should maintain state consistency across all operations", () => {
      const testOperations = [
        { action: "setView", view: "grid" },
        { action: "click", element: "list" },
        { action: "setView", view: "grid" },
        { action: "click", element: "grid" },
        { action: "setView", view: "list" },
        { action: "click", element: "list" },
      ];

      testOperations.forEach((op) => {
        if (op.action === "setView") {
          tableViewHandler.setView(op.view as "list" | "grid");
        } else if (op.action === "click") {
          if (op.element === "list") {
            mockListViewButton.click();
          } else {
            mockGridViewButton.click();
          }
        }

        // Verify state consistency after each operation
        const currentView = tableViewHandler.getCurrentView();
        const expectedTableClass =
          currentView === "grid" ? "grid-view" : "list-view";
        const expectedActiveButton =
          currentView === "grid" ? mockGridViewButton : mockListViewButton;
        const expectedInactiveButton =
          currentView === "grid" ? mockListViewButton : mockGridViewButton;

        expect(mockTableElement.classList.contains(expectedTableClass)).toBe(
          true
        );
        expect(expectedActiveButton.classList.contains("active")).toBe(true);
        expect(expectedActiveButton.getAttribute("aria-pressed")).toBe("true");
        expect(expectedInactiveButton.classList.contains("active")).toBe(false);
        expect(expectedInactiveButton.getAttribute("aria-pressed")).toBe(
          "false"
        );
      });
    });
  });
});
