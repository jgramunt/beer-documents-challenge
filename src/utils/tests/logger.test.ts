import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "../logger.js";

describe("logger", () => {
  // Mock console methods
  const mockConsoleError = vi
    .spyOn(console, "error")
    .mockImplementation(() => {});
  const mockConsoleWarn = vi
    .spyOn(console, "warn")
    .mockImplementation(() => {});
  const mockConsoleInfo = vi
    .spyOn(console, "info")
    .mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("error", () => {
    it("should log error with context and Error message", () => {
      const error = new Error("Something went wrong");
      logger.error("TestContext", error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[TestContext] Something went wrong"
      );
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
    });

    it("should log error with context and string message", () => {
      logger.error("TestContext", "String error message");

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[TestContext] String error message"
      );
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
    });

    it("should handle non-Error objects", () => {
      logger.error("TestContext", 42);

      expect(mockConsoleError).toHaveBeenCalledWith("[TestContext] 42");
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
    });

    it("should handle null/undefined errors", () => {
      logger.error("TestContext", null);

      expect(mockConsoleError).toHaveBeenCalledWith("[TestContext] null");
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
    });
  });

  describe("warn", () => {
    it("should log warning with context", () => {
      logger.warn("TestContext", "Warning message");

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "[TestContext] Warning message"
      );
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
    });

    it("should handle empty message", () => {
      logger.warn("TestContext", "");

      expect(mockConsoleWarn).toHaveBeenCalledWith("[TestContext] ");
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
    });
  });

  describe("info", () => {
    it("should log info with context", () => {
      logger.info("TestContext", "Info message");

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        "[TestContext] Info message"
      );
      expect(mockConsoleInfo).toHaveBeenCalledTimes(1);
    });

    it("should handle empty message", () => {
      logger.info("TestContext", "");

      expect(mockConsoleInfo).toHaveBeenCalledWith("[TestContext] ");
      expect(mockConsoleInfo).toHaveBeenCalledTimes(1);
    });
  });

  describe("different contexts", () => {
    it("should work with different contexts", () => {
      logger.error("DocumentService", new Error("Doc error"));
      logger.warn("UIComponent", "UI warning");
      logger.info("ApiClient", "API info");

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[DocumentService] Doc error"
      );
      expect(mockConsoleWarn).toHaveBeenCalledWith("[UIComponent] UI warning");
      expect(mockConsoleInfo).toHaveBeenCalledWith("[ApiClient] API info");
    });
  });
});
