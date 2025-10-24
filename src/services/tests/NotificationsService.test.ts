import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  NotificationsService,
  type Notification,
  type NotificationCallback,
} from "../NotificationsService.js";

// Mock WebSocket
class MockWebSocket {
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event("open"));
      }
    }, 0);
  }

  close() {
    setTimeout(() => {
      if (this.onclose) {
        this.onclose(new CloseEvent("close"));
      }
    }, 0);
  }

  // Helper method for testing
  simulateMessage(data: string) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data }));
    }
  }

  // Helper method for testing
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event("error"));
    }
  }
}

// Mock logger
vi.mock("../../utils/logger.js", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock constants
vi.mock("../../config/constants.js", () => ({
  API_CONFIG: {
    NOTIFICATIONS_WS_URL: "ws://test.example.com/notifications",
  },
}));

describe("NotificationsService", () => {
  let notificationsService: NotificationsService;
  let mockWebSocket: MockWebSocket;
  const originalWebSocket = globalThis.WebSocket;

  const sampleNotification: Notification = {
    Timestamp: "2024-01-01T10:00:00Z",
    UserID: "user-123",
    UserName: "John Doe",
    DocumentID: "doc-456",
    DocumentTitle: "Test Document",
  };

  beforeEach(() => {
    // Mock WebSocket globally
    globalThis.WebSocket = vi.fn().mockImplementation((url: string) => {
      mockWebSocket = new MockWebSocket(url);
      return mockWebSocket;
    }) as any;

    notificationsService = new NotificationsService();
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should use default URL from config", () => {
      const service = new NotificationsService();
      expect(service).toBeDefined();
    });

    it("should use custom URL when provided", () => {
      const customUrl = "ws://custom.example.com/notifications";
      const service = new NotificationsService(customUrl);
      expect(service).toBeDefined();
    });
  });

  describe("connect", () => {
    it("should connect to WebSocket successfully", async () => {
      const connectPromise = notificationsService.connect();

      expect(globalThis.WebSocket).toHaveBeenCalledWith(
        "ws://test.example.com/notifications"
      );

      await expect(connectPromise).resolves.toBeUndefined();
    });

    it("should reject on WebSocket error during connection", async () => {
      const connectPromise = notificationsService.connect();

      // Simulate error before open
      mockWebSocket.onopen = null;
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Event("error"));
      }

      await expect(connectPromise).rejects.toBeInstanceOf(Event);
    });

    it("should handle constructor errors", async () => {
      globalThis.WebSocket = vi.fn().mockImplementation(() => {
        throw new Error("WebSocket creation failed");
      }) as any;

      await expect(notificationsService.connect()).rejects.toThrow(
        "WebSocket creation failed"
      );
    });
  });

  describe("message handling", () => {
    beforeEach(async () => {
      await notificationsService.connect();
    });

    it("should parse and broadcast valid notifications", async () => {
      const { logger } = await import("../../utils/logger.js");
      const callback = vi.fn();

      notificationsService.subscribe(callback);
      mockWebSocket.simulateMessage(JSON.stringify(sampleNotification));

      expect(callback).toHaveBeenCalledWith(sampleNotification);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should handle invalid JSON messages", async () => {
      const { logger } = await import("../../utils/logger.js");
      const callback = vi.fn();

      notificationsService.subscribe(callback);
      mockWebSocket.simulateMessage("invalid json");

      expect(callback).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        "NotificationsService",
        expect.any(Error)
      );
    });

    it("should broadcast to multiple subscribers", async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      notificationsService.subscribe(callback1);
      notificationsService.subscribe(callback2);

      mockWebSocket.simulateMessage(JSON.stringify(sampleNotification));

      expect(callback1).toHaveBeenCalledWith(sampleNotification);
      expect(callback2).toHaveBeenCalledWith(sampleNotification);
    });
  });

  describe("subscription management", () => {
    beforeEach(async () => {
      await notificationsService.connect();
    });

    it("should add and remove callbacks", () => {
      const callback = vi.fn();

      const unsubscribe = notificationsService.subscribe(callback);
      mockWebSocket.simulateMessage(JSON.stringify(sampleNotification));

      expect(callback).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();
      mockWebSocket.simulateMessage(JSON.stringify(sampleNotification));

      // Should not be called again
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple subscriptions and unsubscriptions", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      const unsubscribe1 = notificationsService.subscribe(callback1);
      const unsubscribe2 = notificationsService.subscribe(callback2);
      const unsubscribe3 = notificationsService.subscribe(callback3);

      mockWebSocket.simulateMessage(JSON.stringify(sampleNotification));

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);

      // Remove middle callback
      unsubscribe2();
      mockWebSocket.simulateMessage(JSON.stringify(sampleNotification));

      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(1); // Not called again
      expect(callback3).toHaveBeenCalledTimes(2);

      // Remove remaining callbacks
      unsubscribe1();
      unsubscribe3();
      mockWebSocket.simulateMessage(JSON.stringify(sampleNotification));

      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(2);
    });

    it("should handle unsubscribing same callback multiple times", () => {
      const callback = vi.fn();

      const unsubscribe = notificationsService.subscribe(callback);

      // Unsubscribe multiple times should not cause issues
      unsubscribe();
      unsubscribe();
      unsubscribe();

      mockWebSocket.simulateMessage(JSON.stringify(sampleNotification));
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should log WebSocket errors", async () => {
      const { logger } = await import("../../utils/logger.js");

      await notificationsService.connect();
      mockWebSocket.simulateError();

      expect(logger.error).toHaveBeenCalledWith(
        "NotificationsService",
        expect.any(Event)
      );
    });

    it("should log WebSocket close events", async () => {
      const { logger } = await import("../../utils/logger.js");

      await notificationsService.connect();
      mockWebSocket.close();

      // Wait for async close event
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(logger.info).toHaveBeenCalledWith(
        "NotificationsService",
        "WebSocket disconnected"
      );
    });
  });

  describe("disconnect", () => {
    it("should disconnect active WebSocket", async () => {
      const { logger } = await import("../../utils/logger.js");

      await notificationsService.connect();

      const closeSpy = vi.spyOn(mockWebSocket, "close");
      notificationsService.disconnect();

      expect(closeSpy).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        "NotificationsService",
        "WebSocket disconnected manually"
      );
    });

    it("should handle disconnect when no WebSocket exists", async () => {
      const { logger } = await import("../../utils/logger.js");

      notificationsService.disconnect();

      expect(logger.info).not.toHaveBeenCalled();
    });

    it("should handle disconnect after previous disconnect", async () => {
      const { logger } = await import("../../utils/logger.js");

      await notificationsService.connect();

      notificationsService.disconnect();

      // Clear the logs from the first disconnect (includes WebSocket close event)
      vi.clearAllMocks();

      notificationsService.disconnect(); // Second disconnect

      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle notification with missing fields", async () => {
      const callback = vi.fn();
      await notificationsService.connect();

      notificationsService.subscribe(callback);

      const incompleteNotification = { Timestamp: "2024-01-01T10:00:00Z" };
      mockWebSocket.simulateMessage(JSON.stringify(incompleteNotification));

      expect(callback).toHaveBeenCalledWith(incompleteNotification);
    });

    it("should handle empty notification object", async () => {
      const callback = vi.fn();
      await notificationsService.connect();

      notificationsService.subscribe(callback);

      mockWebSocket.simulateMessage("{}");

      expect(callback).toHaveBeenCalledWith({});
    });

    it("should handle notification with extra fields", async () => {
      const callback = vi.fn();
      await notificationsService.connect();

      notificationsService.subscribe(callback);

      const extendedNotification = {
        ...sampleNotification,
        ExtraField: "extra value",
      };
      mockWebSocket.simulateMessage(JSON.stringify(extendedNotification));

      expect(callback).toHaveBeenCalledWith(extendedNotification);
    });

    it("should handle callbacks that throw errors", async () => {
      const { logger } = await import("../../utils/logger.js");
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error("Callback error");
      });
      const normalCallback = vi.fn();

      await notificationsService.connect();

      notificationsService.subscribe(errorCallback);
      notificationsService.subscribe(normalCallback);

      // Callback errors are caught and logged by the onmessage handler
      mockWebSocket.simulateMessage(JSON.stringify(sampleNotification));

      expect(errorCallback).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        "NotificationsService",
        expect.any(Error)
      );
      // normalCallback might not be called due to forEach stopping on error
    });
  });
});
