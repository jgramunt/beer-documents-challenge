import { describe, it, expect, beforeEach } from "vitest";
import { DocumentSortingService } from "../DocumentSortingService.js";
import type { Document } from "../../models/Document.js";

describe("DocumentSortingService", () => {
  let sortingService: DocumentSortingService;

  const testDocuments: Document[] = [
    {
      ID: "1",
      Title: "Zebra Document",
      Version: "2.1.0",
      CreatedAt: "2024-01-01",
      UpdatedAt: "2024-01-01",
      Contributors: [],
      Attachments: [],
    },
    {
      ID: "2",
      Title: "Alpha Document",
      Version: "1.0.0",
      CreatedAt: "2024-01-03",
      UpdatedAt: "2024-01-03",
      Contributors: [],
      Attachments: [],
    },
    {
      ID: "3",
      Title: "Beta Document",
      Version: "1.2.1",
      CreatedAt: "2024-01-02",
      UpdatedAt: "2024-01-02",
      Contributors: [],
      Attachments: [],
    },
  ];

  beforeEach(() => {
    sortingService = new DocumentSortingService();
  });

  describe("sortDocuments", () => {
    it("should return copy of original array when sortBy is empty", () => {
      const result = sortingService.sortDocuments(testDocuments, "");

      expect(result).toEqual(testDocuments);
      expect(result).not.toBe(testDocuments); // Should be a copy
    });

    it("should sort by name alphabetically", () => {
      const result = sortingService.sortDocuments(testDocuments, "name");

      expect(result[0].Title).toBe("Alpha Document");
      expect(result[1].Title).toBe("Beta Document");
      expect(result[2].Title).toBe("Zebra Document");
    });

    it("should sort by version correctly", () => {
      const result = sortingService.sortDocuments(testDocuments, "version");

      expect(result[0].Version).toBe("1.0.0");
      expect(result[1].Version).toBe("1.2.1");
      expect(result[2].Version).toBe("2.1.0");
    });

    it("should sort by created date (newest first)", () => {
      const result = sortingService.sortDocuments(testDocuments, "created");

      expect(result[0].CreatedAt).toBe("2024-01-03"); // Newest
      expect(result[1].CreatedAt).toBe("2024-01-02");
      expect(result[2].CreatedAt).toBe("2024-01-01"); // Oldest
    });

    it("should return copy for invalid sort field", () => {
      const result = sortingService.sortDocuments(
        testDocuments,
        "invalid" as any
      );

      expect(result).toEqual(testDocuments);
      expect(result).not.toBe(testDocuments);
    });

    it("should handle empty documents array", () => {
      const result = sortingService.sortDocuments([], "name");

      expect(result).toEqual([]);
    });

    it("should handle single document array", () => {
      const singleDoc = [testDocuments[0]];
      const result = sortingService.sortDocuments(singleDoc, "name");

      expect(result).toEqual(singleDoc);
      expect(result).not.toBe(singleDoc);
    });
  });

  describe("getAvailableSortOptions", () => {
    it("should return all available sort options", () => {
      const options = sortingService.getAvailableSortOptions();

      expect(options).toEqual([
        { value: "", label: "Select one..." },
        { value: "name", label: "Name" },
        { value: "version", label: "Version" },
        { value: "created", label: "Created Date" },
      ]);
    });
  });

  describe("version comparison edge cases", () => {
    it("should handle complex version comparisons", () => {
      const complexVersionDocs: Document[] = [
        {
          ID: "1",
          Title: "Doc A",
          Version: "1.0.0",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
        {
          ID: "2",
          Title: "Doc B",
          Version: "1.0.10",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
        {
          ID: "3",
          Title: "Doc C",
          Version: "1.0.2",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
        {
          ID: "4",
          Title: "Doc D",
          Version: "2.0",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
      ];

      const result = sortingService.sortDocuments(
        complexVersionDocs,
        "version"
      );

      expect(result[0].Version).toBe("1.0.0");
      expect(result[1].Version).toBe("1.0.2");
      expect(result[2].Version).toBe("1.0.10");
      expect(result[3].Version).toBe("2.0");
    });

    it("should handle invalid version numbers", () => {
      const invalidVersionDocs: Document[] = [
        {
          ID: "1",
          Title: "Doc A",
          Version: "invalid.version",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
        {
          ID: "2",
          Title: "Doc B",
          Version: "1.0.0",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
      ];

      const result = sortingService.sortDocuments(
        invalidVersionDocs,
        "version"
      );

      // Should not throw and should handle gracefully
      expect(result).toHaveLength(2);
      expect(result[0].Version).toBe("invalid.version"); // invalid version comes first (treated as 0.0.0)
      expect(result[1].Version).toBe("1.0.0");
    });

    it("should handle empty version strings", () => {
      const emptyVersionDocs: Document[] = [
        {
          ID: "1",
          Title: "Doc A",
          Version: "",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
        {
          ID: "2",
          Title: "Doc B",
          Version: "1.0.0",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
      ];

      const result = sortingService.sortDocuments(emptyVersionDocs, "version");

      expect(result).toHaveLength(2);
      // Empty version should be treated as 0.0.0 and come first
      expect(result[0].Version).toBe("");
      expect(result[1].Version).toBe("1.0.0");
    });

    it("should handle identical versions", () => {
      const identicalVersionDocs: Document[] = [
        {
          ID: "1",
          Title: "Doc A",
          Version: "1.2.3",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
        {
          ID: "2",
          Title: "Doc B",
          Version: "1.2.3",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
      ];

      const result = sortingService.sortDocuments(
        identicalVersionDocs,
        "version"
      );

      expect(result).toHaveLength(2);
      // Order should remain stable for identical versions
      expect(result[0].Version).toBe("1.2.3");
      expect(result[1].Version).toBe("1.2.3");
    });
  });

  describe("name sorting edge cases", () => {
    it("should handle case-insensitive sorting", () => {
      const caseDocs: Document[] = [
        {
          ID: "1",
          Title: "zebra",
          Version: "1.0.0",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
        {
          ID: "2",
          Title: "Alpha",
          Version: "1.0.0",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
        {
          ID: "3",
          Title: "BETA",
          Version: "1.0.0",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
      ];

      const result = sortingService.sortDocuments(caseDocs, "name");

      expect(result[0].Title).toBe("Alpha");
      expect(result[1].Title).toBe("BETA");
      expect(result[2].Title).toBe("zebra");
    });

    it("should handle special characters and numbers in titles", () => {
      const specialDocs: Document[] = [
        {
          ID: "1",
          Title: "2-Document",
          Version: "1.0.0",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
        {
          ID: "2",
          Title: "1-Document",
          Version: "1.0.0",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
        {
          ID: "3",
          Title: "A-Document",
          Version: "1.0.0",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
      ];

      const result = sortingService.sortDocuments(specialDocs, "name");

      expect(result[0].Title).toBe("1-Document");
      expect(result[1].Title).toBe("2-Document");
      expect(result[2].Title).toBe("A-Document");
    });
  });

  describe("date sorting edge cases", () => {
    it("should handle same dates", () => {
      const sameDateDocs: Document[] = [
        {
          ID: "1",
          Title: "Doc A",
          Version: "1.0.0",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
        {
          ID: "2",
          Title: "Doc B",
          Version: "1.0.0",
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
      ];

      const result = sortingService.sortDocuments(sameDateDocs, "created");

      expect(result).toHaveLength(2);
      // Order should remain stable for same dates
    });

    it("should handle different date formats", () => {
      const dateDocs: Document[] = [
        {
          ID: "1",
          Title: "Doc A",
          Version: "1.0.0",
          CreatedAt: "2024-01-01T10:00:00Z",
          UpdatedAt: "2024-01-01",
          Contributors: [],
          Attachments: [],
        },
        {
          ID: "2",
          Title: "Doc B",
          Version: "1.0.0",
          CreatedAt: "2024-01-02",
          UpdatedAt: "2024-01-02",
          Contributors: [],
          Attachments: [],
        },
      ];

      const result = sortingService.sortDocuments(dateDocs, "created");

      expect(result[0].CreatedAt).toBe("2024-01-02"); // Newer first
      expect(result[1].CreatedAt).toBe("2024-01-01T10:00:00Z");
    });
  });
});
