import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateDocumentName,
  validateVersion,
  handleValidation,
} from "../formValidation.js";

// Mock the constants
vi.mock("../../config/constants.js", () => ({
  VALIDATION_CONFIG: {
    MIN_NAME_LENGTH: 3,
    MAX_NAME_LENGTH: 150,
  },
}));

// Mock alert
const mockAlert = vi.fn();
Object.defineProperty(window, "alert", {
  value: mockAlert,
  writable: true,
});

describe("formValidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateDocumentName", () => {
    it("should validate correct document name", () => {
      const result = validateDocumentName("Valid Document Name");
      expect(result).toEqual({ valid: true });
    });

    it("should reject empty name", () => {
      const result = validateDocumentName("");
      expect(result).toEqual({
        valid: false,
        error: "Document name is required",
      });
    });

    it("should reject whitespace-only name", () => {
      const result = validateDocumentName("   ");
      expect(result).toEqual({
        valid: false,
        error: "Document name is required",
      });
    });

    it("should reject name shorter than minimum length", () => {
      const result = validateDocumentName("Hi");
      expect(result).toEqual({
        valid: false,
        error: "Document name must be at least 3 characters",
      });
    });

    it("should accept name exactly at minimum length", () => {
      const result = validateDocumentName("Doc");
      expect(result).toEqual({ valid: true });
    });

    it("should accept name with leading/trailing whitespace (trimmed)", () => {
      const result = validateDocumentName("  Valid Doc  ");
      expect(result).toEqual({ valid: true });
    });

    it("should reject name longer than maximum length", () => {
      const longName = "A".repeat(151);
      const result = validateDocumentName(longName);
      expect(result).toEqual({
        valid: false,
        error: "Document name must be less than 150 characters",
      });
    });

    it("should accept name exactly at maximum length", () => {
      const maxName = "A".repeat(150);
      const result = validateDocumentName(maxName);
      expect(result).toEqual({ valid: true });
    });
  });

  describe("validateVersion", () => {
    it("should validate correct semantic version", () => {
      const result = validateVersion("1.0.0");
      expect(result).toEqual({ valid: true });
    });

    it("should validate multi-digit versions", () => {
      const result = validateVersion("12.34.567");
      expect(result).toEqual({ valid: true });
    });

    it("should reject empty version", () => {
      const result = validateVersion("");
      expect(result).toEqual({
        valid: false,
        error: "Version is required",
      });
    });

    it("should reject whitespace-only version", () => {
      const result = validateVersion("   ");
      expect(result).toEqual({
        valid: false,
        error: "Version is required",
      });
    });

    it("should accept version with leading/trailing whitespace (trimmed)", () => {
      const result = validateVersion("  1.2.3  ");
      expect(result).toEqual({ valid: true });
    });

    it("should reject invalid semantic version - missing parts", () => {
      const result = validateVersion("1.0");
      expect(result).toEqual({
        valid: false,
        error: "Version must follow semantic versioning format (e.g., 1.0.0)",
      });
    });

    it("should reject invalid semantic version - too many parts", () => {
      const result = validateVersion("1.0.0.1");
      expect(result).toEqual({
        valid: false,
        error: "Version must follow semantic versioning format (e.g., 1.0.0)",
      });
    });

    it("should reject invalid semantic version - non-numeric", () => {
      const result = validateVersion("1.a.0");
      expect(result).toEqual({
        valid: false,
        error: "Version must follow semantic versioning format (e.g., 1.0.0)",
      });
    });

    it("should reject invalid semantic version - with v prefix", () => {
      const result = validateVersion("v1.0.0");
      expect(result).toEqual({
        valid: false,
        error: "Version must follow semantic versioning format (e.g., 1.0.0)",
      });
    });

    it("should reject invalid semantic version - with dots but wrong format", () => {
      const result = validateVersion("1..0");
      expect(result).toEqual({
        valid: false,
        error: "Version must follow semantic versioning format (e.g., 1.0.0)",
      });
    });
  });

  describe("handleValidation", () => {
    it("should return true for valid validation result", () => {
      const validResult = { valid: true };
      const result = handleValidation(validResult);

      expect(result).toBe(true);
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it("should return false and show alert for invalid validation result", () => {
      const invalidResult = { valid: false, error: "Test error message" };
      const result = handleValidation(invalidResult);

      expect(result).toBe(false);
      expect(mockAlert).toHaveBeenCalledWith("Test error message");
      expect(mockAlert).toHaveBeenCalledTimes(1);
    });

    it("should handle validation result without error message", () => {
      const invalidResult = { valid: false };
      const result = handleValidation(invalidResult);

      expect(result).toBe(false);
      expect(mockAlert).toHaveBeenCalledWith(undefined);
      expect(mockAlert).toHaveBeenCalledTimes(1);
    });
  });

  describe("integration tests", () => {
    it("should handle full validation workflow", () => {
      // Valid case
      const validName = validateDocumentName("My Document");
      const validVersion = validateVersion("1.0.0");

      expect(handleValidation(validName)).toBe(true);
      expect(handleValidation(validVersion)).toBe(true);
      expect(mockAlert).not.toHaveBeenCalled();

      // Invalid case
      const invalidName = validateDocumentName("");
      expect(handleValidation(invalidName)).toBe(false);
      expect(mockAlert).toHaveBeenCalledWith("Document name is required");
    });
  });
});
