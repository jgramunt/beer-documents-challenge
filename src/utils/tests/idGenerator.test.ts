import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateDocumentId, generateId } from "../idGenerator.js";

describe("idGenerator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("generateDocumentId", () => {
    it("should generate ID with correct prefix", () => {
      const id = generateDocumentId();
      expect(id).toMatch(/^doc_\d+_[a-z0-9]+$/);
    });

    it("should include timestamp", () => {
      const mockTime = 1234567890123;
      vi.setSystemTime(mockTime);

      const id = generateDocumentId();
      expect(id).toContain(`doc_${mockTime}_`);
    });

    it("should generate different IDs on subsequent calls", () => {
      const id1 = generateDocumentId();

      // Advance time slightly
      vi.advanceTimersByTime(1);

      const id2 = generateDocumentId();
      expect(id1).not.toBe(id2);
    });

    it("should have random component of correct length", () => {
      const id = generateDocumentId();
      const parts = id.split("_");
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe("doc");
      expect(parts[1]).toMatch(/^\d+$/); // timestamp
      expect(parts[2]).toMatch(/^[a-z0-9]{9}$/); // random part (9 chars)
    });

    it("should generate multiple unique IDs at same timestamp", () => {
      const ids = [];
      for (let i = 0; i < 10; i++) {
        ids.push(generateDocumentId());
      }

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10); // All should be unique due to random component
    });
  });

  describe("generateId", () => {
    it("should generate ID with correct format", () => {
      const id = generateId();
      expect(id).toMatch(/^\d+_[a-z0-9]+$/);
    });

    it("should include timestamp", () => {
      const mockTime = 1234567890123;
      vi.setSystemTime(mockTime);

      const id = generateId();
      expect(id).toContain(`${mockTime}_`);
    });

    it("should generate different IDs on subsequent calls", () => {
      const id1 = generateId();

      // Advance time slightly
      vi.advanceTimersByTime(1);

      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it("should have random component of correct length", () => {
      const id = generateId();
      const parts = id.split("_");
      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatch(/^\d+$/); // timestamp
      expect(parts[1]).toMatch(/^[a-z0-9]{9}$/); // random part (9 chars)
    });

    it("should generate multiple unique IDs at same timestamp", () => {
      const ids = [];
      for (let i = 0; i < 10; i++) {
        ids.push(generateId());
      }

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10); // All should be unique due to random component
    });
  });

  describe("difference between generators", () => {
    it("should generate different formats", () => {
      vi.setSystemTime(1234567890123);

      const docId = generateDocumentId();
      const regularId = generateId();

      expect(docId).toContain("doc_");
      expect(regularId).not.toContain("doc_");

      // Both should have same timestamp but different structure
      expect(docId).toContain("1234567890123");
      expect(regularId).toContain("1234567890123");
    });
  });
});
