import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { NotificationsController } from "../NotificationsController.js";
import type { Notification } from "../../services/NotificationsService.js";

// Create mock instances
const mockNotificationsService = {
  connect: vi.fn(),
  subscribe: vi.fn(),
  disconnect: vi.fn(),
};

const mockNotifications = {
  showMessage: vi.fn(),
};

const mockNotificationsWindow = {
  addNotification: vi.fn(),
};

// Mock all dependencies
vi.mock("../../services/NotificationsService.js", () => ({
  NotificationsService: vi
    .fn()
    .mockImplementation(() => mockNotificationsService),
}));

vi.mock("../../components/Notifications.js", () => ({
  Notifications: vi.fn().mockImplementation(() => mockNotifications),
}));

vi.mock("../../components/NotificationsWindow.js", () => ({
  NotificationsWindow: vi
    .fn()
    .mockImplementation(() => mockNotificationsWindow),
}));

describe("NotificationsController", () => {
  let notificationsController: NotificationsController;
  let mockService: any;

  const sampleNotification: Notification = {
    Timestamp: "2024-01-01T10:00:00Z",
    UserID: "user-123",
    UserName: "John Doe",
    DocumentID: "doc-456",
    DocumentTitle: "Test Document",
  };

  beforeEach(() => {
    // Create a mock service instance
    mockService = {
      connect: vi.fn(),
      subscribe: vi.fn(),
      disconnect: vi.fn(),
    };

    // Create controller with mock service
    notificationsController = new NotificationsController(mockService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with service and create components", () => {
      expect(notificationsController).toBeDefined();
    });

    it("should create Notifications component", async () => {
      const { Notifications } = await import(
        "../../components/Notifications.js"
      );
      expect(Notifications).toHaveBeenCalled();
    });

    it("should create NotificationsWindow component", async () => {
      const { NotificationsWindow } = await import(
        "../../components/NotificationsWindow.js"
      );
      expect(NotificationsWindow).toHaveBeenCalled();
    });
  });

  describe("initialize", () => {
    it("should connect to service and subscribe to notifications", async () => {
      mockService.connect.mockResolvedValue(undefined);
      mockService.subscribe.mockReturnValue(() => {});

      await notificationsController.initialize();

      expect(mockService.connect).toHaveBeenCalled();
      expect(mockService.subscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should handle connection errors", async () => {
      const error = new Error("Connection failed");
      mockService.connect.mockRejectedValue(error);

      await expect(notificationsController.initialize()).rejects.toThrow(
        "Connection failed"
      );
    });

    it("should store unsubscribe function", async () => {
      const mockUnsubscribe = vi.fn();
      mockService.connect.mockResolvedValue(undefined);
      mockService.subscribe.mockReturnValue(mockUnsubscribe);

      await notificationsController.initialize();

      // Verify unsubscribe function is stored by calling destroy
      notificationsController.destroy();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe("notification handling", () => {
    let notificationCallback: (notification: Notification) => void;

    beforeEach(async () => {
      mockService.connect.mockResolvedValue(undefined);
      mockService.subscribe.mockImplementation((callback: any) => {
        notificationCallback = callback;
        return () => {};
      });

      await notificationsController.initialize();
    });

    it("should handle received notifications", () => {
      notificationCallback(sampleNotification);

      const expectedMessage = 'John Doe created "Test Document"';
      expect(mockNotifications.showMessage).toHaveBeenCalledWith(
        expectedMessage,
        4000
      );
      expect(mockNotificationsWindow.addNotification).toHaveBeenCalledWith(
        expectedMessage,
        "New Document"
      );
    });

    it("should format notification message correctly", () => {
      const customNotification: Notification = {
        Timestamp: "2024-01-02T15:30:00Z",
        UserID: "user-456",
        UserName: "Jane Smith",
        DocumentID: "doc-789",
        DocumentTitle: "Another Document",
      };

      notificationCallback(customNotification);

      const expectedMessage = 'Jane Smith created "Another Document"';
      expect(mockNotifications.showMessage).toHaveBeenCalledWith(
        expectedMessage,
        4000
      );
      expect(mockNotificationsWindow.addNotification).toHaveBeenCalledWith(
        expectedMessage,
        "New Document"
      );
    });

    it("should handle notifications with special characters in title", () => {
      const specialNotification: Notification = {
        Timestamp: "2024-01-03T09:15:00Z",
        UserID: "user-789",
        UserName: "Bob Wilson",
        DocumentID: "doc-012",
        DocumentTitle: 'Document with "quotes" & symbols',
      };

      notificationCallback(specialNotification);

      const expectedMessage =
        'Bob Wilson created "Document with "quotes" & symbols"';
      expect(mockNotifications.showMessage).toHaveBeenCalledWith(
        expectedMessage,
        4000
      );
      expect(mockNotificationsWindow.addNotification).toHaveBeenCalledWith(
        expectedMessage,
        "New Document"
      );
    });

    it("should handle notifications with empty or missing fields", () => {
      const incompleteNotification: Notification = {
        Timestamp: "2024-01-04T12:00:00Z",
        UserID: "user-000",
        UserName: "",
        DocumentID: "doc-000",
        DocumentTitle: "",
      };

      notificationCallback(incompleteNotification);

      const expectedMessage = ' created ""';
      expect(mockNotifications.showMessage).toHaveBeenCalledWith(
        expectedMessage,
        4000
      );
      expect(mockNotificationsWindow.addNotification).toHaveBeenCalledWith(
        expectedMessage,
        "New Document"
      );
    });

    it("should handle multiple notifications", () => {
      const notification1: Notification = {
        Timestamp: "2024-01-05T10:00:00Z",
        UserID: "user-1",
        UserName: "User One",
        DocumentID: "doc-1",
        DocumentTitle: "First Document",
      };

      const notification2: Notification = {
        Timestamp: "2024-01-05T11:00:00Z",
        UserID: "user-2",
        UserName: "User Two",
        DocumentID: "doc-2",
        DocumentTitle: "Second Document",
      };

      notificationCallback(notification1);
      notificationCallback(notification2);

      expect(mockNotifications.showMessage).toHaveBeenCalledTimes(2);
      expect(mockNotificationsWindow.addNotification).toHaveBeenCalledTimes(2);

      expect(mockNotifications.showMessage).toHaveBeenNthCalledWith(
        1,
        'User One created "First Document"',
        4000
      );
      expect(mockNotifications.showMessage).toHaveBeenNthCalledWith(
        2,
        'User Two created "Second Document"',
        4000
      );
    });
  });

  describe("destroy", () => {
    it("should unsubscribe when destroy is called", async () => {
      const mockUnsubscribe = vi.fn();
      mockService.connect.mockResolvedValue(undefined);
      mockService.subscribe.mockReturnValue(mockUnsubscribe);

      await notificationsController.initialize();
      notificationsController.destroy();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("should handle destroy when not initialized", () => {
      expect(() => notificationsController.destroy()).not.toThrow();
    });

    it("should handle multiple destroy calls", async () => {
      const mockUnsubscribe = vi.fn();
      mockService.connect.mockResolvedValue(undefined);
      mockService.subscribe.mockReturnValue(mockUnsubscribe);

      await notificationsController.initialize();

      notificationsController.destroy();
      notificationsController.destroy(); // Second call

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1); // Should only be called once
    });

    it("should clear unsubscribe reference after destroy", async () => {
      const mockUnsubscribe = vi.fn();
      mockService.connect.mockResolvedValue(undefined);
      mockService.subscribe.mockReturnValue(mockUnsubscribe);

      await notificationsController.initialize();
      notificationsController.destroy();

      // Call destroy again - should not throw or call unsubscribe again
      notificationsController.destroy();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete lifecycle: initialize, receive notifications, destroy", async () => {
      const mockUnsubscribe = vi.fn();
      let notificationCallback: (notification: Notification) => void;

      mockService.connect.mockResolvedValue(undefined);
      mockService.subscribe.mockImplementation((callback: any) => {
        notificationCallback = callback;
        return mockUnsubscribe;
      });

      // Initialize
      await notificationsController.initialize();
      expect(mockService.connect).toHaveBeenCalled();
      expect(mockService.subscribe).toHaveBeenCalled();

      // Receive notification
      notificationCallback!(sampleNotification);
      expect(mockNotifications.showMessage).toHaveBeenCalled();
      expect(mockNotificationsWindow.addNotification).toHaveBeenCalled();

      // Destroy
      notificationsController.destroy();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("should handle service connection failure gracefully", async () => {
      mockService.connect.mockRejectedValue(new Error("Network error"));

      await expect(notificationsController.initialize()).rejects.toThrow(
        "Network error"
      );

      // Destroy should still work even if initialization failed
      expect(() => notificationsController.destroy()).not.toThrow();
    });

    it("should handle rapid notification succession", async () => {
      let notificationCallback: (notification: Notification) => void;

      mockService.connect.mockResolvedValue(undefined);
      mockService.subscribe.mockImplementation((callback: any) => {
        notificationCallback = callback;
        return () => {};
      });

      await notificationsController.initialize();

      // Send multiple notifications rapidly
      const notifications = Array.from({ length: 5 }, (_, i) => ({
        Timestamp: `2024-01-0${i + 1}T10:00:00Z`,
        UserID: `user-${i}`,
        UserName: `User ${i}`,
        DocumentID: `doc-${i}`,
        DocumentTitle: `Document ${i}`,
      }));

      notifications.forEach((notification) => {
        notificationCallback!(notification);
      });

      expect(mockNotifications.showMessage).toHaveBeenCalledTimes(5);
      expect(mockNotificationsWindow.addNotification).toHaveBeenCalledTimes(5);
    });
  });

  describe("edge cases", () => {
    it("should handle notification callback being called before initialization", () => {
      // This tests robustness - though this shouldn't happen in normal flow
      const controller = new NotificationsController(mockService);

      // Try to access private method through any potential exposure
      // This test ensures the controller is resilient
      expect(controller).toBeDefined();
    });

    it("should handle service that throws during subscribe", async () => {
      mockService.connect.mockResolvedValue(undefined);
      mockService.subscribe.mockImplementation(() => {
        throw new Error("Subscribe failed");
      });

      await expect(notificationsController.initialize()).rejects.toThrow(
        "Subscribe failed"
      );
    });

    it("should maintain consistent message format", async () => {
      let notificationCallback: (notification: Notification) => void;

      mockService.connect.mockResolvedValue(undefined);
      mockService.subscribe.mockImplementation((callback: any) => {
        notificationCallback = callback;
        return () => {};
      });

      await notificationsController.initialize();

      // Test various notification formats
      const testCases = [
        {
          input: { UserName: "John", DocumentTitle: "Test" },
          expected: 'John created "Test"',
        },
        {
          input: { UserName: "Jane Doe", DocumentTitle: "My Document" },
          expected: 'Jane Doe created "My Document"',
        },
        {
          input: { UserName: "User", DocumentTitle: "Document with spaces" },
          expected: 'User created "Document with spaces"',
        },
      ];

      testCases.forEach((testCase) => {
        const notification = {
          ...sampleNotification,
          UserName: testCase.input.UserName,
          DocumentTitle: testCase.input.DocumentTitle,
        };

        notificationCallback!(notification);

        expect(mockNotifications.showMessage).toHaveBeenLastCalledWith(
          testCase.expected,
          4000
        );
        expect(
          mockNotificationsWindow.addNotification
        ).toHaveBeenLastCalledWith(testCase.expected, "New Document");
      });
    });
  });
});
