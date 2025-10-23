import { getRelativeDays } from "../utils/dateFormatter.js";
import { escapeHtml } from "../utils/htmlEscaping.js";
import { UI_CONFIG } from "../config/constants.js";

export class NotificationsWindow {
  private notificationsWindow: HTMLElement;
  private notificationsList: HTMLElement;
  private closeButton: HTMLElement;
  private notificationContainer: HTMLElement;
  private notifications: Array<{
    title: string;
    message: string;
    timestamp: Date;
  }> = [];

  constructor() {
    this.notificationContainer = document.getElementById(
      "notifications-container"
    )!;
    this.notificationsWindow = document.getElementById("notifications-window")!;
    this.notificationsList = document.getElementById("notifications-list")!;
    this.closeButton = document.getElementById("notifications-close")!;

    if (
      !this.notificationsWindow ||
      !this.notificationsList ||
      !this.closeButton ||
      !this.notificationContainer
    ) {
      throw new Error("Notification window elements not found");
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.notificationContainer.addEventListener("click", () => {
      this.toggle();
    });

    this.closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.close();
    });

    document.addEventListener("click", (e) => {
      if (
        !this.notificationsWindow.contains(e.target as Node) &&
        !this.notificationContainer.contains(e.target as Node)
      ) {
        this.close();
      }
    });
  }

  public toggle(): void {
    if (this.notificationsWindow.classList.contains("hidden")) {
      this.open();
    } else {
      this.close();
    }
  }

  public open(): void {
    this.notificationsWindow.classList.remove("hidden");
  }

  public close(): void {
    this.notificationsWindow.classList.add("hidden");
  }

  public addNotification(
    message: string,
    title: string = "Notification"
  ): void {
    const notification = {
      title,
      message,
      timestamp: new Date(),
    };

    this.notifications.unshift(notification);

    // Keep only the last MAX_NOTIFICATIONS notifications
    if (this.notifications.length > UI_CONFIG.MAX_NOTIFICATIONS) {
      this.notifications.pop();
    }

    this.render();
  }

  private render(): void {
    this.notificationsList.innerHTML = this.notifications
      .map(
        (notif) => `
      <div class="notification-item">
        <div class="notification-item__title">${escapeHtml(notif.title)}</div>
        <div class="notification-item__message">${escapeHtml(
          notif.message
        )}</div>
        <div class="notification-item__timestamp" title="${notif.timestamp.toLocaleString()}">${getRelativeDays(
          notif.timestamp
        )}</div>
      </div>
    `
      )
      .join("");
  }
}
