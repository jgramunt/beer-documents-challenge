import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Notifications } from "../Notifications.js";

// Mock constants
vi.mock("../../config/constants.js", () => ({
  UI_CONFIG: {
    NOTIFICATION_DURATION: 4000,
  },
}));

describe("Notifications", () => {
  let notifications: Notifications;
  let notificationContainer: HTMLElement;
  let notificationText: HTMLElement;
  let notificationBadge: HTMLElement;

  const createMockElements = () => {
    // Create notification container
    notificationContainer = document.createElement("div");
    notificationContainer.id = "notifications-container";

    // Create notification text
    notificationText = document.createElement("div");
    notificationText.className = "notification__text";

    // Create notification badge
    notificationBadge = document.createElement("span");
    notificationBadge.className = "notification__badge";

    // Append child elements to container
    notificationContainer.appendChild(notificationText);
    notificationContainer.appendChild(notificationBadge);

    // Add container to DOM
    document.body.appendChild(notificationContainer);
  };

  beforeEach(() => {
    document.body.innerHTML = "";
    createMockElements();
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with required DOM elements", () => {
      expect(() => new Notifications()).not.toThrow();

      const instance = new Notifications();
      expect(instance).toBeInstanceOf(Notifications);
    });

    it("should throw error when notifications-container is missing", () => {
      document.getElementById("notifications-container")?.remove();

      expect(() => new Notifications()).toThrow(
        "Cannot read properties of null"
      );
    });

    it("should throw error when notification__text is missing", () => {
      notificationText.remove();

      expect(() => new Notifications()).toThrow(
        "Notification elements not found"
      );
    });

    it("should throw error when notification__badge is missing", () => {
      notificationBadge.remove();

      expect(() => new Notifications()).toThrow(
        "Notification elements not found"
      );
    });

    it("should setup hover event listeners on initialization", () => {
      const mouseEnterSpy = vi.spyOn(notificationContainer, "addEventListener");
      const mouseLeaveSpy = vi.spyOn(notificationContainer, "addEventListener");

      new Notifications();

      expect(mouseEnterSpy).toHaveBeenCalledWith(
        "mouseenter",
        expect.any(Function)
      );
      expect(mouseLeaveSpy).toHaveBeenCalledWith(
        "mouseleave",
        expect.any(Function)
      );
    });

    it("should initialize badge with count 0", () => {
      new Notifications();

      expect(notificationBadge.textContent).toBe("0");
    });
  });

  describe("Message Display", () => {
    beforeEach(() => {
      notifications = new Notifications();
    });

    it("should show message with default duration", () => {
      notifications.showMessage("Test message");

      expect(notificationText.textContent).toBe("Test message");
      expect(notificationContainer.classList.contains("show")).toBe(true);
      expect(notificationContainer.classList.contains("hide")).toBe(false);
    });

    it("should show message with custom duration", () => {
      notifications.showMessage("Test message", 5000);

      expect(notificationText.textContent).toBe("Test message");
      expect(notificationContainer.classList.contains("show")).toBe(true);
    });

    it("should increment badge count when showing message", () => {
      expect(notificationBadge.textContent).toBe("0");

      notifications.showMessage("First message");
      expect(notificationBadge.textContent).toBe("1");

      notifications.showMessage("Second message");
      expect(notificationBadge.textContent).toBe("2");
    });

    it("should auto-hide message after default duration", () => {
      notifications.showMessage("Test message");
      expect(notificationContainer.classList.contains("show")).toBe(true);

      vi.advanceTimersByTime(3000);
      expect(notificationContainer.classList.contains("show")).toBe(false);
      expect(notificationContainer.classList.contains("hide")).toBe(true);
    });

    it("should auto-hide message after custom duration", () => {
      notifications.showMessage("Test message", 2000);
      expect(notificationContainer.classList.contains("show")).toBe(true);

      vi.advanceTimersByTime(2000);
      expect(notificationContainer.classList.contains("show")).toBe(false);
      expect(notificationContainer.classList.contains("hide")).toBe(true);
    });

    it("should clear previous timeout when showing new message", () => {
      const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

      notifications.showMessage("First message", 5000);
      notifications.showMessage("Second message", 3000);

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(notificationText.textContent).toBe("Second message");
    });

    it("should handle empty message", () => {
      notifications.showMessage("");

      expect(notificationText.textContent).toBe("");
      expect(notificationContainer.classList.contains("show")).toBe(true);
    });

    it("should handle very long message", () => {
      const longMessage = "A".repeat(1000);
      notifications.showMessage(longMessage);

      expect(notificationText.textContent).toBe(longMessage);
      expect(notificationContainer.classList.contains("show")).toBe(true);
    });
  });

  describe("Manual Hide", () => {
    beforeEach(() => {
      notifications = new Notifications();
    });

    it("should hide message when hide() is called", () => {
      notifications.showMessage("Test message");
      expect(notificationContainer.classList.contains("show")).toBe(true);

      notifications.hide();
      expect(notificationContainer.classList.contains("show")).toBe(false);
      expect(notificationContainer.classList.contains("hide")).toBe(true);
    });

    it("should clear timeout when manually hiding", () => {
      const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

      notifications.showMessage("Test message");
      notifications.hide();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should handle hide when no message is shown", () => {
      expect(() => notifications.hide()).not.toThrow();
      expect(notificationContainer.classList.contains("hide")).toBe(true);
    });
  });

  describe("Badge Management", () => {
    beforeEach(() => {
      notifications = new Notifications();
    });

    it("should reset badge count to zero", () => {
      notifications.showMessage("Message 1");
      notifications.showMessage("Message 2");
      expect(notificationBadge.textContent).toBe("2");

      notifications.resetBadgeCount();
      expect(notificationBadge.textContent).toBe("0");
    });

    it("should update badge after reset and new messages", () => {
      notifications.showMessage("Message 1");
      notifications.resetBadgeCount();
      expect(notificationBadge.textContent).toBe("0");

      notifications.showMessage("New message");
      expect(notificationBadge.textContent).toBe("1");
    });

    it("should handle multiple badge updates", () => {
      for (let i = 1; i <= 10; i++) {
        notifications.showMessage(`Message ${i}`);
        expect(notificationBadge.textContent).toBe(i.toString());
      }
    });
  });

  describe("Hover Behavior", () => {
    beforeEach(() => {
      notifications = new Notifications();
    });

    it("should clear timeout on mouse enter", () => {
      const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

      notifications.showMessage("Test message");

      // Simulate mouse enter
      const mouseEnterEvent = new MouseEvent("mouseenter");
      notificationContainer.dispatchEvent(mouseEnterEvent);

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should not clear timeout on mouse enter if no timeout exists", () => {
      const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

      // Mouse enter without showing message first
      const mouseEnterEvent = new MouseEvent("mouseenter");
      notificationContainer.dispatchEvent(mouseEnterEvent);

      expect(clearTimeoutSpy).not.toHaveBeenCalled();
    });

    it("should restart timeout on mouse leave when message is shown", () => {
      notifications.showMessage("Test message");
      notificationContainer.classList.add("show");

      // Mouse enter to clear timeout
      const mouseEnterEvent = new MouseEvent("mouseenter");
      notificationContainer.dispatchEvent(mouseEnterEvent);

      // Mouse leave to restart timeout
      const mouseLeaveEvent = new MouseEvent("mouseleave");
      notificationContainer.dispatchEvent(mouseLeaveEvent);

      expect(notificationContainer.classList.contains("show")).toBe(true);

      // Advance time by the hide duration
      vi.advanceTimersByTime(4000);
      expect(notificationContainer.classList.contains("show")).toBe(false);
      expect(notificationContainer.classList.contains("hide")).toBe(true);
    });

    it("should not restart timeout on mouse leave when message is not shown", () => {
      // Mouse leave without showing message
      const mouseLeaveEvent = new MouseEvent("mouseleave");
      notificationContainer.dispatchEvent(mouseLeaveEvent);

      // Should not set any timeout
      vi.advanceTimersByTime(5000);
      expect(notificationContainer.classList.contains("show")).toBe(false);
    });

    it("should handle rapid mouse enter/leave events", () => {
      notifications.showMessage("Test message");

      // Rapid mouse events
      for (let i = 0; i < 5; i++) {
        const mouseEnterEvent = new MouseEvent("mouseenter");
        const mouseLeaveEvent = new MouseEvent("mouseleave");

        notificationContainer.dispatchEvent(mouseEnterEvent);
        notificationContainer.dispatchEvent(mouseLeaveEvent);
      }

      expect(notificationContainer.classList.contains("show")).toBe(true);
    });
  });

  describe("CSS Class Management", () => {
    beforeEach(() => {
      notifications = new Notifications();
    });

    it("should remove hide class when showing message", () => {
      notificationContainer.classList.add("hide");

      notifications.showMessage("Test message");

      expect(notificationContainer.classList.contains("hide")).toBe(false);
      expect(notificationContainer.classList.contains("show")).toBe(true);
    });

    it("should handle multiple show/hide cycles", () => {
      for (let i = 0; i < 3; i++) {
        notifications.showMessage(`Message ${i}`);
        expect(notificationContainer.classList.contains("show")).toBe(true);
        expect(notificationContainer.classList.contains("hide")).toBe(false);

        notifications.hide();
        expect(notificationContainer.classList.contains("show")).toBe(false);
        expect(notificationContainer.classList.contains("hide")).toBe(true);
      }
    });

    it("should maintain proper class state during auto-hide", () => {
      notifications.showMessage("Test message", 1000);
      expect(notificationContainer.classList.contains("show")).toBe(true);

      vi.advanceTimersByTime(1000);
      expect(notificationContainer.classList.contains("show")).toBe(false);
      expect(notificationContainer.classList.contains("hide")).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      notifications = new Notifications();
    });

    it("should handle zero duration", () => {
      notifications.showMessage("Test message", 0);
      expect(notificationContainer.classList.contains("show")).toBe(true);

      vi.advanceTimersByTime(0);
      expect(notificationContainer.classList.contains("show")).toBe(false);
    });

    it("should handle negative duration", () => {
      notifications.showMessage("Test message", -1000);
      expect(notificationContainer.classList.contains("show")).toBe(true);

      // Negative timeout should still work (treated as 0)
      vi.advanceTimersByTime(0);
      expect(notificationContainer.classList.contains("show")).toBe(false);
    });

    it("should handle very large duration", () => {
      notifications.showMessage("Test message", 999999);
      expect(notificationContainer.classList.contains("show")).toBe(true);

      vi.advanceTimersByTime(999998);
      expect(notificationContainer.classList.contains("show")).toBe(true);

      vi.advanceTimersByTime(1);
      expect(notificationContainer.classList.contains("show")).toBe(false);
    });

    it("should handle rapid successive messages", () => {
      for (let i = 0; i < 100; i++) {
        notifications.showMessage(`Rapid message ${i}`);
      }

      expect(notificationBadge.textContent).toBe("100");
      expect(notificationText.textContent).toBe("Rapid message 99");
      expect(notificationContainer.classList.contains("show")).toBe(true);
    });

    it("should handle hide after reset badge count", () => {
      notifications.showMessage("Test message");
      notifications.resetBadgeCount();
      notifications.hide();

      expect(notificationBadge.textContent).toBe("0");
      expect(notificationContainer.classList.contains("hide")).toBe(true);
    });
  });
});
