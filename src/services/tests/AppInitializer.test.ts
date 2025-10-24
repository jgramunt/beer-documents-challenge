import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppInitializer } from "../AppInitializer.js";

// Simple mock implementations
vi.mock("../../components/TableViewHandler.js", () => ({
  TableViewHandler: vi.fn(),
}));

vi.mock("../../controllers/DocumentController.js", () => ({
  DocumentController: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("../NotificationsService.js", () => ({
  NotificationsService: vi.fn(),
}));

vi.mock("../../controllers/NotificationsController.js", () => ({
  NotificationsController: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("../../utils/logger.js", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AppInitializer", () => {
  let appInitializer: AppInitializer;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset all mocks to their default implementations
    const { DocumentController } = await import(
      "../../controllers/DocumentController.js"
    );
    const { NotificationsController } = await import(
      "../../controllers/NotificationsController.js"
    );

    vi.mocked(DocumentController).mockImplementation(
      () =>
        ({
          initialize: vi.fn().mockResolvedValue(undefined),
        } as any)
    );

    vi.mocked(NotificationsController).mockImplementation(
      () =>
        ({
          initialize: vi.fn().mockResolvedValue(undefined),
        } as any)
    );

    appInitializer = new AppInitializer();
  });

  describe("initialize", () => {
    it("should complete initialization successfully", async () => {
      await expect(appInitializer.initialize()).resolves.toBeUndefined();
    });

    it("should handle DocumentController initialization failure", async () => {
      // Import mocks dynamically
      const { DocumentController } = await import(
        "../../controllers/DocumentController.js"
      );
      const { logger } = await import("../../utils/logger.js");

      // Override the mock to return a failing controller
      vi.mocked(DocumentController).mockReturnValue({
        initialize: vi.fn().mockRejectedValue(new Error("Doc failed")),
      } as any);

      await expect(appInitializer.initialize()).rejects.toThrow("Doc failed");
      expect(logger.error).toHaveBeenCalledWith(
        "AppInitializer",
        expect.any(Error)
      );
    });

    it("should handle NotificationsController initialization failure gracefully", async () => {
      const { NotificationsController } = await import(
        "../../controllers/NotificationsController.js"
      );
      const { logger } = await import("../../utils/logger.js");

      // Override the mock to return a failing notifications controller
      vi.mocked(NotificationsController).mockReturnValue({
        initialize: vi
          .fn()
          .mockRejectedValue(new Error("Notifications failed")),
      } as any);

      // Should not throw - notifications failure is handled gracefully
      await expect(appInitializer.initialize()).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        "AppInitializer",
        "Failed to initialize notifications"
      );
    });

    it("should call all component constructors", async () => {
      const { TableViewHandler } = await import(
        "../../components/TableViewHandler.js"
      );
      const { DocumentController } = await import(
        "../../controllers/DocumentController.js"
      );
      const { NotificationsService } = await import(
        "../NotificationsService.js"
      );
      const { NotificationsController } = await import(
        "../../controllers/NotificationsController.js"
      );

      await appInitializer.initialize();

      expect(TableViewHandler).toHaveBeenCalledTimes(1);
      expect(DocumentController).toHaveBeenCalledTimes(1);
      expect(NotificationsService).toHaveBeenCalledTimes(1);
      expect(NotificationsController).toHaveBeenCalledTimes(1);
    });

    it("should pass NotificationsService to NotificationsController", async () => {
      const { NotificationsService } = await import(
        "../NotificationsService.js"
      );
      const { NotificationsController } = await import(
        "../../controllers/NotificationsController.js"
      );

      await appInitializer.initialize();

      expect(NotificationsService).toHaveBeenCalledTimes(1);
      expect(NotificationsController).toHaveBeenCalledWith(expect.any(Object));
    });

    it("should call initialize on DocumentController", async () => {
      const mockDocController = {
        initialize: vi.fn().mockResolvedValue(undefined),
      };
      const { DocumentController } = await import(
        "../../controllers/DocumentController.js"
      );
      vi.mocked(DocumentController).mockReturnValue(mockDocController as any);

      await appInitializer.initialize();

      expect(mockDocController.initialize).toHaveBeenCalledTimes(1);
    });

    it("should call initialize on NotificationsController", async () => {
      const mockNotifController = {
        initialize: vi.fn().mockResolvedValue(undefined),
      };
      const { NotificationsController } = await import(
        "../../controllers/NotificationsController.js"
      );
      vi.mocked(NotificationsController).mockReturnValue(
        mockNotifController as any
      );

      await appInitializer.initialize();

      expect(mockNotifController.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("should log and propagate DocumentController errors", async () => {
      const { DocumentController } = await import(
        "../../controllers/DocumentController.js"
      );
      const { logger } = await import("../../utils/logger.js");

      const testError = new Error("Document service failed");
      vi.mocked(DocumentController).mockReturnValue({
        initialize: vi.fn().mockRejectedValue(testError),
      } as any);

      await expect(appInitializer.initialize()).rejects.toBe(testError);
      expect(logger.error).toHaveBeenCalledWith("AppInitializer", testError);
    });

    it("should handle string errors from DocumentController", async () => {
      const { DocumentController } = await import(
        "../../controllers/DocumentController.js"
      );
      const { logger } = await import("../../utils/logger.js");

      const stringError = "String error message";
      vi.mocked(DocumentController).mockReturnValue({
        initialize: vi.fn().mockRejectedValue(stringError),
      } as any);

      await expect(appInitializer.initialize()).rejects.toBe(stringError);
      expect(logger.error).toHaveBeenCalledWith("AppInitializer", stringError);
    });

    it("should only warn for NotificationsController failures, not error", async () => {
      const { NotificationsController } = await import(
        "../../controllers/NotificationsController.js"
      );
      const { logger } = await import("../../utils/logger.js");

      vi.mocked(NotificationsController).mockReturnValue({
        initialize: vi
          .fn()
          .mockRejectedValue(new Error("Notifications failed")),
      } as any);

      await appInitializer.initialize();

      expect(logger.warn).toHaveBeenCalledWith(
        "AppInitializer",
        "Failed to initialize notifications"
      );
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});
